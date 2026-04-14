import Link from "next/link";

type PageProps = {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const firstValue = (
	value: string | string[] | undefined
) => (Array.isArray(value) ? value[0] : value);

export default async function UpdateEmailPage({
	searchParams,
}: PageProps) {
	const params = await searchParams;
	const error = firstValue(params.error);
	const success = firstValue(params.success);

	return (
		<main className="shell">
			<section className="card">
				<p className="eyebrow">Profile</p>
				<h1 className="title">Update Email</h1>
				<p className="subtitle">
					Changing email should stay anchored on the auth app, then route
					back to the correct portal after confirmation.
				</p>
				{error ? (
					<div className="notice error">{error}</div>
				) : null}
				{success ? (
					<div className="notice success">{success}</div>
				) : null}
				<form
					className="form"
					method="post"
					action="/api/auth/update-email"
				>
					<div className="field">
						<label htmlFor="email">New email</label>
						<input
							id="email"
							name="email"
							type="email"
							required
							autoComplete="email"
						/>
					</div>
					<div className="actions">
						<Link href="/">Back</Link>
						<button className="button" type="submit">
							Request email change
						</button>
					</div>
				</form>
			</section>
		</main>
	);
}
