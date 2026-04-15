import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAuthAppUrl } from "@/lib/supabase/config";

export async function POST(request: NextRequest) {
	const formData = await request.formData();
	const email = String(formData.get("email") ?? "").trim();

	if (!email) {
		return NextResponse.redirect(
			new URL(
				`/update-email?error=${encodeURIComponent("Email is required")}`,
				getAuthAppUrl()
			),
			303
		);
	}

	const supabase = await createSupabaseServerClient();
	const { data: sessionData } = await supabase.auth.getSession();

	if (!sessionData.session) {
		return NextResponse.redirect(
			new URL(
				`/login?error=${encodeURIComponent(
					"Please sign in before updating email"
				)}`,
				getAuthAppUrl()
			),
			303
		);
	}

	const redirectUrl = new URL("/update-email", getAuthAppUrl());
	const { error } = await supabase.auth.updateUser(
		{ email },
		{ emailRedirectTo: redirectUrl.toString() }
	);

	if (error) {
		return NextResponse.redirect(
			new URL(
				`/update-email?error=${encodeURIComponent(error.message)}`,
				getAuthAppUrl()
			),
			303
		);
	}

	return NextResponse.redirect(
		new URL(
			`/update-email?success=${encodeURIComponent(
				"Confirmation sent. Finish the email change from your inbox."
			)}`,
			getAuthAppUrl()
		),
		303
	);
}
