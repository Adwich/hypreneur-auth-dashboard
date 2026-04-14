"use client";

import { createBrowserClient } from "@supabase/ssr";
import {
	getCookieDomain,
	getSupabaseAnonKey,
	getSupabaseUrl,
} from "./config";

export const createSupabaseBrowserClient = () =>
	createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey(), {
		cookieOptions: {
			domain: getCookieDomain(),
			path: "/",
			sameSite: "lax",
			secure: process.env.NODE_ENV === "production",
		},
	});
