import Link from "next/link";
import { AuthShell } from "../auth-shell";

export default function AccessDeniedPage() {
	return (
		<AuthShell
			eyebrow="Access"
			title="Account not provisioned"
			subtitle="Your account signed in successfully, but it is not linked to an active Hypreneur workspace yet."
		>
				<div className="notice error">
					Ask an administrator to create the correct membership in
					<code> client_users </code>
					or
					<code> internal_users </code>
					before trying again.
				</div>
				<div className="actions">
					<Link href="/logout">Sign out</Link>
					<Link className="button secondary" href="/login">
						Back to login
					</Link>
				</div>
		</AuthShell>
	);
}
