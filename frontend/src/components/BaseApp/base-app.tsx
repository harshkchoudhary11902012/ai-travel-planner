"use client";

import type { ReactNode } from "react";
import { AppShell } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

import { useUser } from "@/context/user-context";

import { AppShellHeader } from "./app-shell-header";
import { AppShellSidebar } from "./app-shell-sidebar";

type BaseAppProps = {
	children: ReactNode;
};

export function BaseApp({ children }: BaseAppProps) {
	const [mobileNavOpened, { toggle: toggleMobileNav, close: closeMobileNav }] = useDisclosure();
	const [desktopNavCollapsed, { toggle: toggleDesktopNav }] = useDisclosure(false);
	const { user } = useUser();

	return (
		<AppShell
			header={{ height: 60 }}
			navbar={{
				width: 260,
				breakpoint: "sm",
				collapsed: { mobile: !mobileNavOpened, desktop: desktopNavCollapsed },
			}}
			padding={{ base: 12, sm: 16, md: 24 }}
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
			<AppShell.Navbar p={24} h="100%">
				<AppShellSidebar onNavClick={closeMobileNav} />
			</AppShell.Navbar>
			<AppShell.Main>{children}</AppShell.Main>
		</AppShell>
	);
}
