import { type SupabaseClient } from "@supabase/supabase-js";
import {
	getAdminAppUrl,
	getAuthAppUrl,
	getClientAppUrl,
} from "@/lib/supabase/config";

export type PortalName = "admin" | "client";

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
};

const normalizePortals = (value: unknown): PortalName[] => {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.filter(
		portal => portal === "admin" || portal === "client"
	) as PortalName[];
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
		default_portal:
			row.default_portal === "admin" ||
			row.default_portal === "client"
				? row.default_portal
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
	preferredPortal === "admin" || preferredPortal === "client"
		? resolution.portals.includes(preferredPortal)
		: false;

export const getPortalUrl = (
	portal: PortalName
) => {
	return portal === "admin"
		? getAdminAppUrl()
		: getClientAppUrl();
};

export const getPortalRedirectTarget = (
	resolution: PortalResolution,
	preferredPortal: string | null
) => {
	if (
		preferredPortalAllowed(resolution, preferredPortal)
	) {
		return getPortalUrl(preferredPortal as PortalName);
	}

	if (resolution.default_portal) {
		return getPortalUrl(resolution.default_portal);
	}

	if (resolution.portals.length > 1) {
		return new URL("/select-portal", getAuthAppUrl()).toString();
	}

	return new URL("/access-denied", getAuthAppUrl()).toString();
};
