import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAuthAppUrl } from "@/lib/supabase/config";
import { getPortalRedirectTarget, resolvePortal } from "@/lib/auth/portal";

export default async function HomePage() {
	const supabase = await createSupabaseServerClient();
	const { data } = await supabase.auth.getSession();

	if (!data.session) {
		redirect(new URL("/login", getAuthAppUrl()).toString());
	}

	const resolution = await resolvePortal(supabase);
	redirect(getPortalRedirectTarget(resolution, null));
}
