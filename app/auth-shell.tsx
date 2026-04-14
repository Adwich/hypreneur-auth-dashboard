import Image from "next/image";
import type { ReactNode } from "react";

type AuthShellProps = {
	eyebrow?: string;
	title: string;
	subtitle?: string;
	children: ReactNode;
	portal?: string | null;
};

const getPortalLabel = (portal?: string | null) => {
	if (portal === "admin") {
		return "Admin workspace";
	}

	if (portal === "client") {
		return "Client workspace";
	}

	return null;
};

export function AuthShell({
	eyebrow,
	title,
	subtitle,
	children,
	portal,
}: AuthShellProps) {
	const portalLabel = getPortalLabel(portal);

	return (
		<main className="shell">
			<section className="auth-panel">
				<div className="brand-lockup">
					<Image
						src="/logo-blue.svg"
						alt="Hypreneur"
						width={148}
						height={37}
						priority
						className="brand-mark"
					/>
					{portalLabel ? (
						<span className="portal-chip">{portalLabel}</span>
					) : null}
				</div>
				<section className="card">
					{eyebrow ? (
						<p className="eyebrow">{eyebrow}</p>
					) : null}
					<h1 className="title">{title}</h1>
					{subtitle ? (
						<p className="subtitle">{subtitle}</p>
					) : null}
					{children}
				</section>
			</section>
		</main>
	);
}
