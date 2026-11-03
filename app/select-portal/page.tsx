import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
	getPortalRedirectTarget,
	getPortalUrl,
	isMiraPortal,
	resolvePortal,
	type PortalName,
} from "@/lib/auth/portal";
import { getAuthAppUrl } from "@/lib/supabase/config";

// Mira portals live off-domain — a bare link to their origin wouldn't carry
// the session cookie. Instead, link through /api/portal-handoff which reads
// the current (auth-origin) session and redirects with a #access_token fragment.
const getSelectPortalHref = (portal: PortalName): string | null => {
	if (isMiraPortal(portal)) {
		const url = new URL("/api/portal-handoff", getAuthAppUrl());
		url.searchParams.set("portal", portal);
		return url.toString();
	}
	return getPortalUrl(portal);
};
import { AuthShell } from "../auth-shell";

export default async function SelectPortalPage() {
	const supabase = await createSupabaseServerClient();
	const { data } = await supabase.auth.getSession();

	if (!data.session) {
		redirect("/login");
	}

	const resolution = await resolvePortal(supabase);

	if (resolution.portals.length <= 1) {
		redirect(getPortalRedirectTarget(resolution, null));
	}

	return (
		<AuthShell
			eyebrow="Workspace"
			title="Choose your workspace"
			subtitle="This account can access more than one Hypreneur workspace."
		>
				<div className="stack">
					{resolution.portals.map(portal => {
						const href = getSelectPortalHref(portal);
						if (!href) return null;
						return (
							<a
								key={portal}
								className="portal-link"
								href={href}
							>
								<span style={{ textTransform: "capitalize" }}>
									{portal.replace("mira-", "mira / ")}
								</span>
								<span className="small">Open</span>
							</a>
						);
					})}
				</div>
		</AuthShell>
	);
}
