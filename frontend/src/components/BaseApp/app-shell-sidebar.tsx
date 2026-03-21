"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
	ActionIcon,
	AppShell,
	Button,
	Group,
	NavLink,
	Stack,
	ThemeIcon,
	useMantineColorScheme,
} from "@mantine/core";
import {
	IconLayoutDashboard,
	IconLogout,
	IconMoon,
	IconPlus,
	IconSun,
	IconX,
} from "@tabler/icons-react";
import { showNotification } from "@mantine/notifications";

import { logout } from "@/lib/auth";

type AppShellSidebarProps = {
	onNavClick?: () => void;
};

export function AppShellSidebar({ onNavClick }: AppShellSidebarProps) {
	const { colorScheme, toggleColorScheme } = useMantineColorScheme();
	const pathname = usePathname();
	const router = useRouter();

	const afterNav = () => {
		onNavClick?.();
	};

	return (
		<>
			<AppShell.Section pb={8}>
				<Group justify="flex-end" hiddenFrom="sm">
					<ActionIcon
						variant="subtle"
						c="#FFF"
						onClick={afterNav}
						aria-label="Close menu"
					>
						<IconX size={20} stroke={1.75} />
					</ActionIcon>
				</Group>
			</AppShell.Section>

			<AppShell.Section grow>
				<Stack justify="center" mt={20} gap="lg" c="#FFF">
					<NavLink
						component={Link}
						href="/dashboard"
						label="Dashboard"
						leftSection={<IconLayoutDashboard size={18} stroke={1.5} />}
						active={pathname === "/dashboard"}
						onClick={afterNav}
					/>
					<NavLink
						component={Link}
						href="/new"
						label="New trip"
						leftSection={<IconPlus size={18} stroke={1.5} />}
						active={pathname === "/new"}
						onClick={afterNav}
					/>
				</Stack>
			</AppShell.Section>

			<AppShell.Section>
				<Stack justify="flex-end" gap="lg" c="#FFF">
					<NavLink
						component="button"
						type="button"
						leftSection={
							colorScheme === "dark" ? (
								<ThemeIcon color="yellow" variant="transparent">
									<IconSun size={18} />
								</ThemeIcon>
							) : (
								<ThemeIcon color="gray" variant="transparent">
									<IconMoon size={18} />
								</ThemeIcon>
							)
						}
						color="#FFF"
						variant="subtle"
						label={colorScheme === "dark" ? "Light mode" : "Dark mode"}
						onClick={() => {
							toggleColorScheme();
							afterNav();
						}}
					/>
					<Button
						leftSection={<IconLogout size={18} stroke={1.5} aria-hidden />}
						variant="filled"
						color="red"
						onClick={() => {
							showNotification({
								title: "Successfully logged out",
								message: "See you next time.",
								color: "orange",
								position: "top-center",
								autoClose: 5000,
								withCloseButton: true,
							});
							logout();
							router.replace("/");
							afterNav();
						}}
					>
						Log out
					</Button>
				</Stack>
			</AppShell.Section>
		</>
	);
}
