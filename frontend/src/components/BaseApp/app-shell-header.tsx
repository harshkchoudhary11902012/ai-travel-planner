"use client";

import { ActionIcon, Avatar, Box, Burger, Group, Skeleton, Text, Title } from "@mantine/core";
import { IconMenu2, IconX } from "@tabler/icons-react";

import {
	avatarInitialsFromUser,
	displayFullName,
	type AuthenticatedUser,
} from "@/lib/user-display";

type AppShellHeaderProps = {
	mobileNavOpened: boolean;
	onToggleMobileNav: () => void;
	desktopNavCollapsed: boolean;
	onToggleDesktopNav: () => void;
	user: AuthenticatedUser | null;
};

export function AppShellHeader({
	mobileNavOpened,
	onToggleMobileNav,
	desktopNavCollapsed,
	onToggleDesktopNav,
	user,
}: AppShellHeaderProps) {
	return (
		<Box
			h="100%"
			px={24}
			style={{
				display: "grid",
				gridTemplateColumns: "minmax(100px, 1fr) minmax(0, auto) minmax(100px, 1fr)",
				alignItems: "center",
			}}
		>
			<Group gap={8} wrap="nowrap">
				<Burger opened={mobileNavOpened} onClick={onToggleMobileNav} hiddenFrom="sm" />
				<ActionIcon
					variant="subtle"
					onClick={onToggleDesktopNav}
					visibleFrom="sm"
					size="lg"
				>
					{desktopNavCollapsed ? <IconMenu2 size={20} /> : <IconX size={20} />}
				</ActionIcon>
			</Group>

			<Title order={3}>AI Travel Planner</Title>

			<Group justify="flex-end" gap={12} wrap="nowrap">
				{user ? (
					<>
						<Box ta="right" visibleFrom="xs">
							<Text size="sm" fw={600} lh={1.3}>
								{displayFullName(user)}
							</Text>
							<Text size="xs" c="dimmed" lh={1.3}>
								{user.email}
							</Text>
						</Box>
						<Avatar radius="xl" color="mainColor">
							{avatarInitialsFromUser(user)}
						</Avatar>
					</>
				) : (
					<Skeleton height={40} width={160} radius="sm" />
				)}
			</Group>
		</Box>
	);
}
