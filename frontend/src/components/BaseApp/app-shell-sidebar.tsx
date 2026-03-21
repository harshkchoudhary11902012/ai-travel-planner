"use client";

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
	IconListDetails,
	IconLogout,
	IconMapRoute,
	IconMoon,
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

	const path = pathname || "";
	const activeDashboard = path === "/dashboard";
	const activePlan = path.startsWith("/dashboard/plan");
	const activeTripsHub = path.startsWith("/dashboard/trips") || path.startsWith("/trips/");

	return (
		<>
			<AppShell.Section pb={8}>
				<Group justify="flex-end" hiddenFrom="sm">
					<ActionIcon variant="subtle" onClick={afterNav}>
						<IconX size={20} />
					</ActionIcon>
				</Group>
			</AppShell.Section>

			<AppShell.Section grow>
				<Stack justify="center" mt={20} gap="xs">
					<NavLink
						href="/dashboard"
						label="Dashboard"
						description="Overview of your workspace"
						leftSection={<IconLayoutDashboard size={18} stroke={1.5} />}
						active={activeDashboard}
						onClick={afterNav}
					/>
					<NavLink
						href="/dashboard/plan"
						label="Plan trip"
						description="Destination, days, budget, interests"
						leftSection={<IconMapRoute size={18} stroke={1.5} />}
						active={activePlan}
						onClick={afterNav}
					/>
					<NavLink
						href="/dashboard/trips"
						label="My trips"
						description="Itinerary, budget, hotels, edits"
						leftSection={<IconListDetails size={18} stroke={1.5} />}
						active={activeTripsHub}
						onClick={afterNav}
					/>
				</Stack>
			</AppShell.Section>

			<AppShell.Section>
				<Stack justify="flex-end" gap="lg">
					<NavLink
						leftSection={
							colorScheme === "dark" ? (
								<ThemeIcon color="yellow" variant="transparent">
									<IconSun size={20} />
								</ThemeIcon>
							) : (
								<ThemeIcon color="gray" variant="transparent">
									<IconMoon size={20} />
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
						variant="outline"
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
