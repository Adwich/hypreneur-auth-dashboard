import Link from "next/link";

export default function AccessDeniedPage() {
	return (
		<main className="shell">
			<section className="card">
				<p className="eyebrow">Access</p>
				<h1 className="title">Account Not Provisioned</h1>
				<p className="subtitle">
					This account authenticated successfully, but it is not linked
					to a client or admin workspace yet.
				</p>
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
			</section>
		</main>
	);
}
