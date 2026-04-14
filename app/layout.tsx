import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "Hypreneur Auth",
	description: "Unified authentication for Hypreneur dashboards",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	);
}
