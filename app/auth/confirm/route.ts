import { NextRequest, NextResponse } from "next/server";
import type {
	EmailOtpType,
	SupabaseClient,
} from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
	getAuthAppUrl,
	getMiraSupplierUrl,
	getMiraWarehouseUrl,
	isAllowedRedirectUrl,
	isMiraPortalUrl,
} from "@/lib/supabase/config";
import {
	getEffectivePortal,
	getPortalRedirectTarget,
	getPortalUrl,
	isMiraPortal,
	resolvePortal,
	type PortalName,
	type PortalResolution,
} from "@/lib/auth/portal";

// Cross-origin handoff for mira portals (own Vercel projects — session cookies
// can't travel across origins). Append access + refresh tokens as a URL fragment;
// the mira portal's /auth/finalize page reads window.location.hash and calls
// supabase.auth.setSession() on its own origin.
const buildMiraHandoffUrl = (portalUrl: string, accessToken: string, refreshToken: string): string => {
	const url = new URL(portalUrl);
	// If the mira portal URL came in as a bare origin, land on /auth/finalize.
	if (url.pathname === "/" || url.pathname === "") {
		url.pathname = "/auth/finalize";
	}
	url.hash = `access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(refreshToken)}`;
	return url.toString();
};

// verifyOtp writes the session under the cookie named by `preferredPortal`
// (or the default cookie when it's null — e.g. a magic link whose redirect_to
// carries no ?portal). But we redirect the user to their resolved portal's app,
// which reads that portal's cookie. When those differ the destination can't see
// the session and bounces to /login. Re-establish the session under the portal
// we're actually sending them to so the cookie name matches.
//
// Mira portals live on their own origin — cookies can't travel. For them we
// pass the session tokens as a URL fragment handoff instead.
const finalizePortalRedirect = async (
	supabase: SupabaseClient,
	resolution: PortalResolution,
	preferredPortal: string | null
) => {
	const effectivePortal = getEffectivePortal(
		resolution,
		preferredPortal
	);

	// Mira handoff: fragment-based session passing for off-domain portals.
	if (effectivePortal && isMiraPortal(effectivePortal)) {
		const portalUrl = getPortalUrl(effectivePortal);
		if (portalUrl) {
			const { data } = await supabase.auth.getSession();
			const session = data.session;
			if (session) {
				return NextResponse.redirect(
					buildMiraHandoffUrl(
						portalUrl,
						session.access_token,
						session.refresh_token
					)
				);
			}
			// No session (shouldn't happen after verifyOtp OK) — send user to
			// the mira portal's login so they can retry.
			return NextResponse.redirect(new URL("/login", portalUrl).toString());
		}
	}

	// Same-domain portals (admin / client): rewrite the cookie under the
	// destination portal's name so the destination can read the session.
	if (effectivePortal && effectivePortal !== preferredPortal) {
		const { data } = await supabase.auth.getSession();
		const session = data.session;

		if (session) {
			const portalClient = await createSupabaseServerClient({
				portal: effectivePortal,
			});
			await portalClient.auth.setSession({
				access_token: session.access_token,
				refresh_token: session.refresh_token,
			});
		}
	}

	return NextResponse.redirect(
		getPortalRedirectTarget(resolution, preferredPortal)
	);
};

const normalizePortal = (value: string | null): PortalName | null => {
	if (
		value === "admin" ||
		value === "client" ||
		value === "mira-warehouse" ||
		value === "mira-supplier"
	) {
		return value;
	}
	return null;
};

const getPortalFromRedirectTo = (
	redirectTo: string | null
) => {
	if (!redirectTo) {
		return null;
	}

	try {
		const url = new URL(redirectTo);
		// Explicit ?portal= wins (admin / client flows).
		const explicit = normalizePortal(
			url.searchParams.get("portal")
		);
		if (explicit) return explicit;

		// Infer mira portal from the redirect_to origin itself.
		const origin = url.origin;
		const warehouse = getMiraWarehouseUrl();
		if (warehouse && origin === new URL(warehouse).origin) {
			return "mira-warehouse" as const;
		}
		const supplier = getMiraSupplierUrl();
		if (supplier && origin === new URL(supplier).origin) {
			return "mira-supplier" as const;
		}

		return null;
	} catch {
		return null;
	}
};

const getSafeRedirectUrl = (
	redirectTo: string | null,
	fallbackPath: string
) => {
	if (redirectTo && isAllowedRedirectUrl(redirectTo)) {
		return new URL(redirectTo);
	}

	return new URL(fallbackPath, getAuthAppUrl());
};

const shouldResolvePortalAfterVerification = (
	type: EmailOtpType,
	redirectTo: string | null
) => {
	if (
		type !== "email" &&
		type !== "magiclink" &&
		type !== "signup"
	) {
		return false;
	}

	if (!redirectTo) {
		return true;
	}

	try {
		const redirectUrl = new URL(redirectTo);
		const authOrigin = new URL(getAuthAppUrl()).origin;

		return (
			redirectUrl.origin === authOrigin &&
			(redirectUrl.pathname === "/" ||
				redirectUrl.pathname === "/login")
		);
	} catch {
		return false;
	}
};

export async function GET(request: NextRequest) {
	const url = new URL(request.url);
	const tokenHash = url.searchParams.get("token_hash");
	const type = url.searchParams.get("type") as EmailOtpType | null;
	const redirectTo = url.searchParams.get("redirect_to");
	const portal =
		normalizePortal(url.searchParams.get("portal")) ??
		getPortalFromRedirectTo(redirectTo);
	const next = url.searchParams.get("next");

	if (!tokenHash || !type) {
		return NextResponse.redirect(
			new URL(
				`/login?error=${encodeURIComponent(
					"Missing email confirmation token"
				)}`,
				getAuthAppUrl()
			)
		);
	}

	const supabase = await createSupabaseServerClient({ portal });
	const { error } = await supabase.auth.verifyOtp({
		token_hash: tokenHash,
		type,
	});

	if (error) {
		return NextResponse.redirect(
			new URL(
				`/login?error=${encodeURIComponent(error.message)}`,
				getAuthAppUrl()
			)
		);
	}

	if (type === "recovery" || type === "invite") {
		// Invited / recovering users MUST set a password first. Never honor
		// redirect_to here — a Supabase dashboard invite's redirect_to is the
		// Site URL (an allowed origin), so getSafeRedirectUrl would bypass the
		// set-password page and the user would never get a working password.
		const destination = new URL("/update-password", getAuthAppUrl());
		if (portal) {
			destination.searchParams.set("portal", portal);
		}
		return NextResponse.redirect(destination);
	}

	// When redirect_to points at a mira portal, we MUST route through
	// finalizePortalRedirect so the session is passed as a URL fragment
	// (cross-origin → no cookie travel). getSafeRedirectUrl would send the
	// user there without any auth and they'd bounce back to login.
	const redirectIsMiraPortal =
		redirectTo && isMiraPortalUrl(redirectTo);

	if (
		shouldResolvePortalAfterVerification(type, redirectTo) ||
		redirectIsMiraPortal
	) {
		const resolution = await resolvePortal(supabase);
		return finalizePortalRedirect(supabase, resolution, portal);
	}

	if (redirectTo) {
		return NextResponse.redirect(
			getSafeRedirectUrl(redirectTo, "/")
		);
	}

	if (next?.startsWith("/")) {
		return NextResponse.redirect(
			new URL(next, getAuthAppUrl())
		);
	}

	const resolution = await resolvePortal(supabase);
	return finalizePortalRedirect(supabase, resolution, portal);
}
