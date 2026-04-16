import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
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

export const updateSession = async (request: NextRequest) => {
	let response = NextResponse.next({
		request,
	});

	const supabase = createServerClient(
		getSupabaseUrl(),
		getSupabaseAnonKey(),
		{
			cookieOptions: withCookieDefaults(),
			cookies: {
				getAll() {
					return request.cookies.getAll();
				},
				setAll(cookiesToSet: SupabaseCookie[]) {
					for (const cookie of cookiesToSet) {
						request.cookies.set(cookie.name, cookie.value);
					}

					response = NextResponse.next({
						request,
					});

					for (const cookie of cookiesToSet) {
						response.cookies.set(
							cookie.name,
							cookie.value,
							withCookieDefaults(cookie.options)
						);
					}
				},
			},
		}
	);

	await supabase.auth.getUser();

	return response;
};
