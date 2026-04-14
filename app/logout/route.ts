import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAuthAppUrl } from "@/lib/supabase/config";

export async function GET() {
	const supabase = await createSupabaseServerClient();
	await supabase.auth.signOut();

	return NextResponse.redirect(
		new URL("/login", getAuthAppUrl())
	);
}
