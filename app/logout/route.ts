import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAuthAppUrl } from "@/lib/supabase/config";

export async function GET(request: Request) {
	const url = new URL(request.url);
	const portal = url.searchParams.get("portal");
	const supabase = await createSupabaseServerClient({ portal });
	await supabase.auth.signOut();

	const loginUrl = new URL("/login", getAuthAppUrl());
	if (portal === "admin" || portal === "client") {
		loginUrl.searchParams.set("portal", portal);
	}

	return NextResponse.redirect(loginUrl);
}
