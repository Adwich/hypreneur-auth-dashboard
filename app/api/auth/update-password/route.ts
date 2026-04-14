import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
	getAuthAppUrl,
} from "@/lib/supabase/config";
import {
	getPortalRedirectTarget,
	resolvePortal,
} from "@/lib/auth/portal";

export async function POST(request: NextRequest) {
	const formData = await request.formData();
	const password = String(formData.get("password") ?? "");

	if (!password || password.length < 8) {
		return NextResponse.redirect(
			new URL(
				`/update-password?error=${encodeURIComponent(
					"Password must be at least 8 characters"
				)}`,
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
					"Recovery session expired"
				)}`,
				getAuthAppUrl()
			),
			303
		);
	}

	const { error } = await supabase.auth.updateUser({
		password,
	});

	if (error) {
		return NextResponse.redirect(
			new URL(
				`/update-password?error=${encodeURIComponent(error.message)}`,
				getAuthAppUrl()
			),
			303
		);
	}

	const resolution = await resolvePortal(supabase);
	return NextResponse.redirect(
		new URL(getPortalRedirectTarget(resolution, null)),
		303
	);
}
