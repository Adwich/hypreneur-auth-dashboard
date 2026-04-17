import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
	getAuthAppUrl,
	isAllowedRedirectUrl,
} from "@/lib/supabase/config";
import {
	getPortalRedirectTarget,
	resolvePortal,
} from "@/lib/auth/portal";

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
		const destination = getSafeRedirectUrl(
			redirectTo,
			"/update-password"
		);
		if (portal) {
			destination.searchParams.set("portal", portal);
		}
		return NextResponse.redirect(destination);
	}

	if (
		shouldResolvePortalAfterVerification(type, redirectTo)
	) {
		const resolution = await resolvePortal(supabase);
		return NextResponse.redirect(
			getPortalRedirectTarget(resolution, portal)
		);
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
	return NextResponse.redirect(
		getPortalRedirectTarget(resolution, portal)
	);
}
