import { NextRequest, NextResponse } from "next/server";
import type {
	EmailOtpType,
	SupabaseClient,
} from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
	getAuthAppUrl,
	isAllowedRedirectUrl,
} from "@/lib/supabase/config";
import {
	getEffectivePortal,
	getPortalRedirectTarget,
	resolvePortal,
	type PortalResolution,
} from "@/lib/auth/portal";

// verifyOtp writes the session under the cookie named by `preferredPortal`
// (or the default cookie when it's null — e.g. a magic link whose redirect_to
// carries no ?portal). But we redirect the user to their resolved portal's app,
// which reads that portal's cookie. When those differ the destination can't see
// the session and bounces to /login. Re-establish the session under the portal
// we're actually sending them to so the cookie name matches.
const finalizePortalRedirect = async (
	supabase: SupabaseClient,
	resolution: PortalResolution,
	preferredPortal: string | null
) => {
	const effectivePortal = getEffectivePortal(
		resolution,
		preferredPortal
	);

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

const normalizePortal = (value: string | null) =>
	value === "admin" || value === "client" ? value : null;

const getPortalFromRedirectTo = (
	redirectTo: string | null
) => {
	if (!redirectTo) {
		return null;
	}

	try {
		const url = new URL(redirectTo);
		return normalizePortal(url.searchParams.get("portal"));
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

	if (
		shouldResolvePortalAfterVerification(type, redirectTo)
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
