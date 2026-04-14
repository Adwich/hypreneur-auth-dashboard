type PageProps = {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const firstValue = (
	value: string | string[] | undefined
) => (Array.isArray(value) ? value[0] : value);

export default async function ForgotPasswordPage({
	searchParams,
}: PageProps) {
	const params = await searchParams;
	const error = firstValue(params.error);
	const success = firstValue(params.success);
	const portal = firstValue(params.portal);

	return (
		<main className="shell">
			<section className="card">
				<p className="eyebrow">Recovery</p>
				<h1 className="title">Reset Password</h1>
				<p className="subtitle">
					Request a recovery link. The email will send you back to this
					auth app.
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
					action="/api/auth/forgot-password"
				>
					<input
						type="hidden"
						name="portal"
						value={portal ?? ""}
					/>
					<div className="field">
						<label htmlFor="email">Email</label>
						<input
							id="email"
							name="email"
							type="email"
							required
							autoComplete="email"
						/>
					</div>
					<div className="actions">
						<a href={`/login${portal ? `?portal=${portal}` : ""}`}>
							Back to login
						</a>
						<button className="button" type="submit">
							Send reset link
						</button>
					</div>
				</form>
			</section>
		</main>
	);
}
