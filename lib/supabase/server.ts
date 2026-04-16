import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
	getCookieDomain,
	getPortalCookieName,
	getSupabaseAnonKey,
	getSupabaseUrl,
} from "./config";

type SupabaseCookie = {
	name: string;
	value: string;
	options?: CookieOptions;
};

const withCookieDefaults = (
	options?: CookieOptions,
	cookieName?: string
) => {
	const domain = options?.domain ?? getCookieDomain();

	return {
		...options,
		...(cookieName ? { name: cookieName } : {}),
		...(domain ? { domain } : {}),
		path: options?.path ?? "/",
		sameSite: options?.sameSite ?? "lax",
		secure:
			typeof options?.secure === "boolean"
				? options.secure
				: process.env.NODE_ENV === "production",
	};
};

export const createSupabaseServerClient = async (options?: {
	portal?: string | null;
	cookieName?: string;
}) => {
	const cookieStore = await cookies();
	const cookieName =
		options?.cookieName ??
		getPortalCookieName(options?.portal);

	return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
		cookieOptions: withCookieDefaults(undefined, cookieName),
		cookies: {
			getAll() {
				return cookieStore.getAll();
			},
			setAll(cookiesToSet: SupabaseCookie[]) {
				for (const cookie of cookiesToSet) {
					try {
						cookieStore.set(
							cookie.name,
							cookie.value,
							withCookieDefaults(
								cookie.options,
								cookieName
							)
						);
					} catch {
						// Server components can read the session without always
						// being allowed to write refreshed cookies.
					}
				}
			},
		},
	});
};
