"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { AppShell } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

import { fetchMe } from "@/lib/auth";
import type { AuthenticatedUser } from "@/lib/user-display";

import { AppShellHeader } from "./app-shell-header";
import { AppShellSidebar } from "./app-shell-sidebar";

type BaseAppProps = {
	children: ReactNode;
};

export function BaseApp({ children }: BaseAppProps) {
	const [mobileNavOpened, { toggle: toggleMobileNav, close: closeMobileNav }] = useDisclosure();
	const [desktopNavCollapsed, { toggle: toggleDesktopNav }] = useDisclosure(false);
	const [user, setUser] = useState<AuthenticatedUser | null>(null);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const { user: u } = await fetchMe();
				if (!cancelled && u?.email)
					setUser({
						email: u.email,
						firstName: u.firstName,
						lastName: u.lastName,
					});
			} catch {
				if (!cancelled) setUser(null);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	return (
		<AppShell
			header={{ height: 60 }}
			navbar={{
				width: 260,
				breakpoint: "sm",
				collapsed: { mobile: !mobileNavOpened, desktop: desktopNavCollapsed },
			}}
			padding={24}
			layout="alt"
		>
			<AppShell.Header>
				<AppShellHeader
					mobileNavOpened={mobileNavOpened}
					onToggleMobileNav={toggleMobileNav}
					desktopNavCollapsed={desktopNavCollapsed}
					onToggleDesktopNav={toggleDesktopNav}
					user={user}
				/>
			</AppShell.Header>
			<AppShell.Navbar
				p={24}
				h="100%"
				bg={"linear-gradient(139deg, #1F2328 0%, #1A1C1F 100%)"}
			>
				<AppShellSidebar onNavClick={closeMobileNav} />
			</AppShell.Navbar>
			<AppShell.Main>{children}</AppShell.Main>
		</AppShell>
	);
}
