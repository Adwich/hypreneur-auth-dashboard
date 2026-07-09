import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAuthAppUrl } from "@/lib/supabase/config";
import { getPortalRedirectTarget, resolvePortal } from "@/lib/auth/portal";

const normalizePortal = (value: string | undefined) =>
	value === "admin" || value === "client" ? value : null;

export default async function HomePage({
	searchParams,
}: {
	searchParams: Promise<{ portal?: string | string[] }>;
}) {
	const params = await searchParams;
	const portal = normalizePortal(
		Array.isArray(params.portal) ? params.portal[0] : params.portal
	);

	const supabase = await createSupabaseServerClient({ portal });
	const { data } = await supabase.auth.getSession();

	if (!data.session) {
		const loginUrl = new URL("/login", getAuthAppUrl());
		if (portal) {
			loginUrl.searchParams.set("portal", portal);
		}
		redirect(loginUrl.toString());
	}

	const resolution = await resolvePortal(supabase);
	redirect(getPortalRedirectTarget(resolution, portal));
}
