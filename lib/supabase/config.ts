const requiredEnv = (name: string) => {
	const value = process.env[name];

	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}

	return value;
};

export const getSupabaseUrl = () =>
	requiredEnv("SUPABASE_URL");

export const getSupabaseAnonKey = () =>
	requiredEnv("SUPABASE_ANON_KEY");

export const getAuthAppUrl = () =>
	requiredEnv("NEXT_PUBLIC_AUTH_URL");

export const getClientAppUrl = () =>
	requiredEnv("NEXT_PUBLIC_CLIENT_APP_URL");

export const getAdminAppUrl = () =>
	requiredEnv("NEXT_PUBLIC_ADMIN_APP_URL");

// Mira portals live on their own origins (own Vercel projects, not under
// .hypreneur.space). Env is optional — unset means that portal isn't
// available in this environment yet.
export const getMiraWarehouseUrl = () =>
	process.env.NEXT_PUBLIC_MIRA_WAREHOUSE_URL?.trim() || null;

export const getMiraSupplierUrl = () =>
	process.env.NEXT_PUBLIC_MIRA_SUPPLIER_URL?.trim() || null;

export const getCookieDomain = () =>
	process.env.AUTH_COOKIE_DOMAIN?.trim() ||
	(process.env.NODE_ENV === "production"
		? ".hypreneur.space"
		: undefined);

const normalizePortal = (portal?: string | null) =>
	portal === "admin" || portal === "client"
		? portal
		: null;

export const getPortalCookieName = (portal?: string | null) => {
	const normalizedPortal = normalizePortal(portal);

	if (normalizedPortal === "admin") {
		return (
			process.env.AUTH_COOKIE_NAME_ADMIN?.trim() ||
			"sb-hypreneur-admin-auth-token"
		);
	}

	if (normalizedPortal === "client") {
		return (
			process.env.AUTH_COOKIE_NAME_CLIENT?.trim() ||
			"sb-hypreneur-client-auth-token"
		);
	}

	return (
		process.env.AUTH_COOKIE_NAME?.trim() ||
		"sb-hypreneur-auth-token"
	);
};

const normalizeOrigin = (value: string) => new URL(value).origin;

const allowedRedirectOrigins = () => {
	const set = new Set<string>([
		normalizeOrigin(getAuthAppUrl()),
		normalizeOrigin(getClientAppUrl()),
		normalizeOrigin(getAdminAppUrl()),
	]);
	const warehouse = getMiraWarehouseUrl();
	if (warehouse) {
		try { set.add(normalizeOrigin(warehouse)); } catch {}
	}
	const supplier = getMiraSupplierUrl();
	if (supplier) {
		try { set.add(normalizeOrigin(supplier)); } catch {}
	}
	return set;
};

// Returns true if the given URL's origin is one of the mira portals (lives
// on its own domain, so session cookies can't travel from .hypreneur.space).
// Such redirects need the token-fragment handoff in /auth/confirm.
export const isMiraPortalUrl = (value: string): boolean => {
	try {
		const origin = normalizeOrigin(value);
		const warehouse = getMiraWarehouseUrl();
		const supplier = getMiraSupplierUrl();
		if (warehouse && normalizeOrigin(warehouse) === origin) return true;
		if (supplier && normalizeOrigin(supplier) === origin) return true;
		return false;
	} catch {
		return false;
	}
};

export const isAllowedRedirectUrl = (value: string) => {
	try {
		return allowedRedirectOrigins().has(
			normalizeOrigin(value)
		);
	} catch {
		return false;
	}
};
