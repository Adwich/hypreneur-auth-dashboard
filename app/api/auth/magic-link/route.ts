import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import {
	getAuthAppUrl,
	getSupabaseAnonKey,
	getSupabaseUrl,
} from "@/lib/supabase/config";

const loginUrl = (portal: string | null) => {
	const url = new URL("/login", getAuthAppUrl());
	if (portal) {
		url.searchParams.set("portal", portal);
	}
	return url;
};

export async function POST(request: NextRequest) {
	const formData = await request.formData();
	const email = String(formData.get("email") ?? "").trim();
	const portal = String(formData.get("portal") ?? "").trim() || null;

	if (!email) {
		const url = loginUrl(portal);
		url.searchParams.set("error", "Email is required");
		return NextResponse.redirect(url, 303);
	}

	// @supabase/ssr hardcodes flowType: "pkce", which makes GoTrue email a
	// pkce_ token_hash. Those cannot be exchanged for a session by the
	// verifyOtp({ token_hash }) pattern used in /auth/confirm — verifyOtp
	// returns no session (and no error), so logins silently fail. Send the
	// magic link from a plain implicit-flow client so the emailed token_hash
	// is stateless and verifiable server-side. No session is created here, so
	// this client needs no cookie persistence.
	const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
		auth: {
			flowType: "implicit",
			persistSession: false,
			autoRefreshToken: false,
			detectSessionInUrl: false,
		},
	});
	const redirectUrl = new URL("/", getAuthAppUrl());
	if (portal) {
		redirectUrl.searchParams.set("portal", portal);
	}

	const { error } = await supabase.auth.signInWithOtp({
		email,
		options: {
			shouldCreateUser: false,
			emailRedirectTo: redirectUrl.toString(),
		},
	});

	const responseUrl = loginUrl(portal);

	if (error) {
		responseUrl.searchParams.set("error", error.message);
		return NextResponse.redirect(responseUrl, 303);
	}

	responseUrl.searchParams.set(
		"success",
		"Magic link sent. Check your inbox and spam folder."
	);
	return NextResponse.redirect(responseUrl, 303);
}
