import { AuthShell } from "../auth-shell";

type PageProps = {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const firstValue = (
	value: string | string[] | undefined
) => (Array.isArray(value) ? value[0] : value);

export default async function LoginPage({
	searchParams,
}: PageProps) {
	const params = await searchParams;
	const error = firstValue(params.error);
	const portal = firstValue(params.portal);

	return (
		<AuthShell
			eyebrow="Account access"
			title="Sign in to Hypreneur"
			subtitle="Use your Hypreneur account to continue to the correct workspace."
			portal={portal}
		>
				{error ? (
					<div className="notice error">{error}</div>
				) : null}
				<form
					className="form"
					method="post"
					action="/api/auth/login"
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
					<div className="field">
						<label htmlFor="password">Password</label>
						<input
							id="password"
							name="password"
							type="password"
							required
							autoComplete="current-password"
						/>
					</div>
					<div className="actions">
						<a href={`/forgot-password${portal ? `?portal=${portal}` : ""}`}>
							Forgot password?
						</a>
						<button className="button" type="submit">
							Sign in
						</button>
					</div>
				</form>
		</AuthShell>
	);
}
