import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAuthAppUrl } from "@/lib/supabase/config";

const forgotPasswordUrl = (portal: string | null) => {
	const url = new URL("/forgot-password", getAuthAppUrl());
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
		const url = forgotPasswordUrl(portal);
		url.searchParams.set("error", "Email is required");
		return NextResponse.redirect(url, 303);
	}

	const supabase = await createSupabaseServerClient();
	const callbackUrl = new URL("/auth/callback", getAuthAppUrl());
	callbackUrl.searchParams.set("next", "/update-password");
	if (portal) {
		callbackUrl.searchParams.set("portal", portal);
	}

	const { error } = await supabase.auth.resetPasswordForEmail(email, {
		redirectTo: callbackUrl.toString(),
	});

	const redirectUrl = forgotPasswordUrl(portal);

	if (error) {
		redirectUrl.searchParams.set("error", error.message);
		return NextResponse.redirect(redirectUrl, 303);
	}

	redirectUrl.searchParams.set(
		"success",
		"Reset email sent. Check your inbox and spam folder."
	);
	return NextResponse.redirect(redirectUrl, 303);
}
