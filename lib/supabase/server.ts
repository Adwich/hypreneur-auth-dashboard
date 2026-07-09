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
		// Email magic links are verified server-side via verifyOtp({ token_hash }).
		// The implicit flow makes that verification stateless — it does not depend on
		// a PKCE code_verifier cookie surviving from the "send link" request to the
		// click, which was silently failing and bouncing users to /login.
		auth: { flowType: "implicit" },
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
