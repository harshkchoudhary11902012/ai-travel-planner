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
			px={{ base: 10, xs: 12, sm: 16, md: 24 }}
			py={4}
			miw={0}
			style={{
				display: "flex",
				alignItems: "center",
				gap: "var(--mantine-spacing-xs)",
			}}
		>
			<Group gap={4} wrap="nowrap" flex="0 0 auto">
				<Burger opened={mobileNavOpened} onClick={onToggleMobileNav} hiddenFrom="sm" size="sm" />
				<ActionIcon
					variant="subtle"
					onClick={onToggleDesktopNav}
					visibleFrom="sm"
					size="lg"
					aria-label={desktopNavCollapsed ? "Expand sidebar" : "Collapse sidebar"}
				>
					{desktopNavCollapsed ? <IconMenu2 size={20} /> : <IconX size={20} />}
				</ActionIcon>
			</Group>

			<Title
				order={3}
				fw={700}
				fz={{ base: "clamp(0.8125rem, 2.8vw, 1.125rem)", sm: undefined }}
				ta="center"
				lineClamp={1}
				style={{
					flex: "1 1 auto",
					minWidth: 0,
					overflow: "hidden",
					textOverflow: "ellipsis",
				}}
			>
				AI Travel Planner
			</Title>

			<Group justify="flex-end" gap="sm" wrap="nowrap" flex="0 0 auto" miw={0}>
				{user ? (
					<>
						<Box ta="right" visibleFrom="xs" miw={0} maw={240}>
							<Text size="sm" fw={600} lh={1.3} truncate>
								{displayFullName(user)}
							</Text>
							<Text size="xs" c="dimmed" lh={1.3} truncate>
								{user.email}
							</Text>
						</Box>
						<Avatar radius="xl" color="mainColor" size="md">
							{avatarInitialsFromUser(user)}
						</Avatar>
					</>
				) : (
					<>
						<Skeleton height={40} w={40} radius="xl" hiddenFrom="sm" />
						<Skeleton height={40} width={160} radius="sm" visibleFrom="sm" />
					</>
				)}
			</Group>
		</Box>
	);
}
