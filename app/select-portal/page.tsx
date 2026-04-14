import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
	getPortalRedirectTarget,
	getPortalUrl,
	resolvePortal,
} from "@/lib/auth/portal";

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
		<main className="shell">
			<section className="card">
				<p className="eyebrow">Portal Select</p>
				<h1 className="title">Choose A Portal</h1>
				<p className="subtitle">
					This account has access to more than one workspace.
				</p>
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
							<span className="small">Open workspace</span>
						</a>
					))}
				</div>
			</section>
		</main>
	);
}
