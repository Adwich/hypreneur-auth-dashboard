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

export const getCookieDomain = () =>
	process.env.AUTH_COOKIE_DOMAIN?.trim() || undefined;

const normalizeOrigin = (value: string) => new URL(value).origin;

const allowedRedirectOrigins = () =>
	new Set([
		normalizeOrigin(getAuthAppUrl()),
		normalizeOrigin(getClientAppUrl()),
		normalizeOrigin(getAdminAppUrl()),
	]);

export const isAllowedRedirectUrl = (value: string) => {
	try {
		return allowedRedirectOrigins().has(
			normalizeOrigin(value)
		);
	} catch {
		return false;
	}
};
