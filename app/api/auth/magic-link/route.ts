import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAuthAppUrl } from "@/lib/supabase/config";

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

	const supabase = await createSupabaseServerClient();
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
