import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
	getCookieDomain,
	getSupabaseAnonKey,
	getSupabaseUrl,
} from "./config";

type SupabaseCookie = {
	name: string;
	value: string;
	options?: CookieOptions;
};

const withCookieDefaults = (options?: CookieOptions) => {
	const domain = options?.domain ?? getCookieDomain();

	return {
		...options,
		...(domain ? { domain } : {}),
		path: options?.path ?? "/",
		sameSite: options?.sameSite ?? "lax",
		secure:
			typeof options?.secure === "boolean"
				? options.secure
				: process.env.NODE_ENV === "production",
	};
};

export const createSupabaseServerClient = async () => {
	const cookieStore = await cookies();

	return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
		cookieOptions: withCookieDefaults(),
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
							withCookieDefaults(cookie.options)
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
