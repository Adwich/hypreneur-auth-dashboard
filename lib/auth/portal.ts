import { type SupabaseClient } from "@supabase/supabase-js";
import {
	getAdminAppUrl,
	getAuthAppUrl,
	getClientAppUrl,
	getMiraSupplierUrl,
	getMiraWarehouseUrl,
} from "@/lib/supabase/config";

export type PortalName =
	| "admin"
	| "client"
	| "mira-warehouse"
	| "mira-supplier";

const ALL_PORTAL_NAMES: PortalName[] = [
	"admin",
	"client",
	"mira-warehouse",
	"mira-supplier",
];
const isPortalName = (v: unknown): v is PortalName =>
	typeof v === "string" &&
	(ALL_PORTAL_NAMES as string[]).includes(v);

export type MiraRoleRow = {
	role: "warehouse" | "supplier" | string;
	store_id: string;
	label: string | null;
};

export type PortalResolution = {
	user_id: string;
	portals: PortalName[];
	default_portal: PortalName | null;
	internal_role: string | null;
	client_memberships: Array<{
		client_id: string;
		role: string;
	}>;
	default_client_id: string | null;
	display_name: string | null;
	email: string | null;
	mira_roles: MiraRoleRow[];
};

const normalizePortals = (value: unknown): PortalName[] => {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.filter(isPortalName) as PortalName[];
};

const normalizeMiraRoles = (value: unknown): MiraRoleRow[] => {
	if (!Array.isArray(value)) return [];
	return value
		.map(item => {
			if (!item || typeof item !== "object") return null;
			const r = item as Record<string, unknown>;
			if (
				typeof r.role !== "string" ||
				typeof r.store_id !== "string"
			)
				return null;
			return {
				role: r.role,
				store_id: r.store_id,
				label: typeof r.label === "string" ? r.label : null,
			};
		})
		.filter((r): r is MiraRoleRow => Boolean(r));
};

const normalizeClientMemberships = (
	value: unknown
): PortalResolution["client_memberships"] => {
	if (!Array.isArray(value)) {
		return [];
	}

	return value
		.map(item => {
			if (
				typeof item !== "object" ||
				item === null ||
				!("client_id" in item) ||
				!("role" in item)
			) {
				return null;
			}

			const clientId = item.client_id;
			const role = item.role;

			if (
				typeof clientId !== "string" ||
				typeof role !== "string"
			) {
				return null;
			}

			return {
				client_id: clientId,
				role,
			};
		})
		.filter(
			(
				item
			): item is PortalResolution["client_memberships"][number] =>
				Boolean(item)
		);
};

export const normalizePortalResolution = (
	value: unknown
): PortalResolution | null => {
	if (!value || typeof value !== "object") {
		return null;
	}

	const rawRow = Array.isArray(value) ? value[0] : value;

	if (
		!rawRow ||
		typeof rawRow !== "object" ||
		!("user_id" in rawRow)
	) {
		return null;
	}

	const row = rawRow as Record<string, unknown>;

	return {
		user_id:
			typeof row.user_id === "string" ? row.user_id : "",
		portals: normalizePortals(row.portals),
		default_portal: isPortalName(row.default_portal)
			? (row.default_portal as PortalName)
			: null,
		internal_role:
			typeof row.internal_role === "string"
				? row.internal_role
				: null,
		client_memberships: normalizeClientMemberships(
			row.client_memberships
		),
		default_client_id:
			typeof row.default_client_id === "string"
				? row.default_client_id
				: null,
		display_name:
			typeof row.display_name === "string"
				? row.display_name
				: null,
		email:
			typeof row.email === "string" ? row.email : null,
		mira_roles: normalizeMiraRoles(row.mira_roles),
	};
};

export const resolvePortal = async (
	supabase: SupabaseClient
) => {
	const { data, error } = await supabase.rpc(
		"auth_resolve_portal"
	);

	if (error) {
		throw new Error(error.message);
	}

	const resolution = normalizePortalResolution(data);

	if (!resolution?.user_id) {
		throw new Error(
			"Portal resolution returned an invalid payload"
		);
	}

	return resolution;
};

const preferredPortalAllowed = (
	resolution: PortalResolution,
	preferredPortal: string | null
) =>
	isPortalName(preferredPortal)
		? resolution.portals.includes(preferredPortal as PortalName)
		: false;

export const getEffectivePortal = (
	resolution: PortalResolution,
	preferredPortal: string | null
): PortalName | null => {
	if (preferredPortalAllowed(resolution, preferredPortal)) {
		return preferredPortal as PortalName;
	}

	if (resolution.default_portal) {
		return resolution.default_portal;
	}

	return null;
};

export const getPortalUrl = (portal: PortalName): string | null => {
	if (portal === "admin") return getAdminAppUrl();
	if (portal === "client") return getClientAppUrl();
	if (portal === "mira-warehouse") return getMiraWarehouseUrl();
	if (portal === "mira-supplier") return getMiraSupplierUrl();
	return null;
};

// Mira portals live on their own origin — session cookies can't travel to
// them from .hypreneur.space. The /auth/confirm handler needs to hand off
// via URL fragment (#access_token=…&refresh_token=…) and the mira portal
// picks it up at /auth/finalize to call setSession() on its own origin.
export const isMiraPortal = (portal: PortalName): boolean =>
	portal === "mira-warehouse" || portal === "mira-supplier";

export const getPortalRedirectTarget = (
	resolution: PortalResolution,
	preferredPortal: string | null
): string => {
	if (preferredPortalAllowed(resolution, preferredPortal)) {
		const url = getPortalUrl(preferredPortal as PortalName);
		if (url) return url;
	}

	if (resolution.default_portal) {
		const url = getPortalUrl(resolution.default_portal);
		if (url) return url;
	}

	if (resolution.portals.length > 1) {
		return new URL("/select-portal", getAuthAppUrl()).toString();
	}

	return new URL("/access-denied", getAuthAppUrl()).toString();
};
