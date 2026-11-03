// Mira portal handoff route.
//
// select-portal links send the user here when they pick mira-warehouse /
// mira-supplier. On the auth.hypreneur.space origin we still have the user's
// session (just verified via /auth/confirm), so we grab the tokens and
// redirect to the mira portal's /auth/finalize with the session as a URL
// fragment. The mira portal reads the fragment and calls setSession() on
// its own origin so cookies land there — cross-origin cookies can't travel.

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
	getAuthAppUrl,
	getMiraSupplierUrl,
	getMiraWarehouseUrl,
} from "@/lib/supabase/config";

const buildHandoffUrl = (
	portalUrl: string,
	accessToken: string,
	refreshToken: string
): string => {
	const url = new URL(portalUrl);
	if (url.pathname === "/" || url.pathname === "") {
		url.pathname = "/auth/finalize";
	}
	url.hash = `access_token=${encodeURIComponent(
		accessToken
	)}&refresh_token=${encodeURIComponent(refreshToken)}`;
	return url.toString();
};

export async function GET(request: NextRequest) {
	const url = new URL(request.url);
	const portal = url.searchParams.get("portal");

	let portalUrl: string | null = null;
	if (portal === "mira-warehouse") portalUrl = getMiraWarehouseUrl();
	else if (portal === "mira-supplier") portalUrl = getMiraSupplierUrl();

	if (!portalUrl) {
		return NextResponse.redirect(
			new URL("/access-denied", getAuthAppUrl())
		);
	}

	// Use the DEFAULT cookie because /auth/confirm wrote the session there
	// (we only rewrite under portal cookies for admin/client, not for mira).
	const supabase = await createSupabaseServerClient({ portal: null });
	const { data } = await supabase.auth.getSession();
	const session = data.session;

	if (!session) {
		// No session on auth origin — send the user back to login on their
		// chosen portal, where they can request a fresh code.
		return NextResponse.redirect(new URL("/login", portalUrl));
	}

	return NextResponse.redirect(
		buildHandoffUrl(
			portalUrl,
			session.access_token,
			session.refresh_token
		)
	);
}
