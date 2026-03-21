import type { Metadata } from "next";
import { ColorSchemeScript } from "@mantine/core";
import { Poppins, Space_Grotesk } from "next/font/google";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import { Providers } from "./providers";

const poppins = Poppins({
	subsets: ["latin"],
	variable: "--font-poppins",
	weight: ["300", "400", "500", "600", "700"],
	display: "swap",
});

const spaceGrotesk = Space_Grotesk({
	subsets: ["latin"],
	variable: "--font-space-grotesk",
	display: "swap",
});

export const metadata: Metadata = {
	title: "AI Travel Planner",
	description:
		"Plan trips with AI-generated itineraries, budgets, and hotels—edit days, regenerate, and restore revisions.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			className={`${poppins.variable} ${spaceGrotesk.variable}`}
			suppressHydrationWarning
		>
			<head>
				<ColorSchemeScript defaultColorScheme="light" />
			</head>
			<body className={poppins.className}>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
