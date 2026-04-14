import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAuthAppUrl } from "@/lib/supabase/config";
import {
	getPortalRedirectTarget,
	resolvePortal,
} from "@/lib/auth/portal";

const loginUrl = (portal: string | null, error?: string) => {
	const url = new URL("/login", getAuthAppUrl());

	if (portal) {
		url.searchParams.set("portal", portal);
	}

	if (error) {
		url.searchParams.set("error", error);
	}

	return url;
};

export async function POST(request: NextRequest) {
	const formData = await request.formData();
	const email = String(formData.get("email") ?? "").trim();
	const password = String(formData.get("password") ?? "");
	const portal = String(formData.get("portal") ?? "").trim() || null;

	if (!email || !password) {
		return NextResponse.redirect(
			loginUrl(portal, "Email and password are required"),
			303
		);
	}

	const supabase = await createSupabaseServerClient();
	const { error } = await supabase.auth.signInWithPassword({
		email,
		password,
	});

	if (error) {
		return NextResponse.redirect(
			loginUrl(portal, error.message),
			303
		);
	}

	const resolution = await resolvePortal(supabase);
	return NextResponse.redirect(
		new URL(getPortalRedirectTarget(resolution, portal)),
		303
	);
}
