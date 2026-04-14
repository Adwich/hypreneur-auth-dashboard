import Link from "next/link";
import { AuthShell } from "../auth-shell";

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
		<AuthShell
			eyebrow="Profile"
			title="Change your email"
			subtitle="Use the address you want to use for future Hypreneur sign-ins."
		>
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
		</AuthShell>
	);
}
