import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
	getAuthAppUrl,
} from "@/lib/supabase/config";
import {
	getPortalRedirectTarget,
	resolvePortal,
} from "@/lib/auth/portal";

export async function GET(request: NextRequest) {
	const url = new URL(request.url);
	const code = url.searchParams.get("code");
	const next = url.searchParams.get("next");
	const portal = url.searchParams.get("portal");
	const supabase = await createSupabaseServerClient();

	if (!code) {
		return NextResponse.redirect(
			new URL(
				`/login?error=${encodeURIComponent("Missing auth code")}`,
				getAuthAppUrl()
			)
		);
	}

	const { error } = await supabase.auth.exchangeCodeForSession(code);

	if (error) {
		return NextResponse.redirect(
			new URL(
				`/login?error=${encodeURIComponent(error.message)}`,
				getAuthAppUrl()
			)
		);
	}

	if (next?.startsWith("/")) {
		const nextUrl = new URL(next, getAuthAppUrl());
		if (portal) {
			nextUrl.searchParams.set("portal", portal);
		}
		return NextResponse.redirect(nextUrl);
	}

	const resolution = await resolvePortal(supabase);
	return NextResponse.redirect(
		getPortalRedirectTarget(resolution, portal)
	);
}
