import { AuthShell } from "../auth-shell";

type PageProps = {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const firstValue = (
	value: string | string[] | undefined
) => (Array.isArray(value) ? value[0] : value);

export default async function UpdatePasswordPage({
	searchParams,
}: PageProps) {
	const params = await searchParams;
	const error = firstValue(params.error);

	return (
		<AuthShell
			eyebrow="Password recovery"
			title="Set a new password"
			subtitle="Choose a new password for your Hypreneur account."
		>
				{error ? (
					<div className="notice error">{error}</div>
				) : null}
				<form
					className="form"
					method="post"
					action="/api/auth/update-password"
				>
					<div className="field">
						<label htmlFor="password">New password</label>
						<input
							id="password"
							name="password"
							type="password"
							required
							autoComplete="new-password"
							minLength={8}
						/>
					</div>
					<div className="actions">
						<a href="/login">Back to login</a>
						<button className="button" type="submit">
							Update password
						</button>
					</div>
				</form>
		</AuthShell>
	);
}
