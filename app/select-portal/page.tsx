import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
	getPortalRedirectTarget,
	getPortalUrl,
	resolvePortal,
} from "@/lib/auth/portal";
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
					{resolution.portals.map(portal => (
						<a
							key={portal}
							className="portal-link"
							href={getPortalUrl(portal)}
						>
							<span style={{ textTransform: "capitalize" }}>
								{portal}
							</span>
							<span className="small">Open</span>
						</a>
					))}
				</div>
		</AuthShell>
	);
}
