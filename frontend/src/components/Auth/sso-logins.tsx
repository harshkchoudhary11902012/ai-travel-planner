"use client";

import { Button, Divider, Flex, Group, Stack, Text } from "@mantine/core";
import { IconBrandApple, IconBrandGoogle } from "@tabler/icons-react";
import { showNotification } from "@mantine/notifications";

export function SsoLogins() {
	const comingSoon = () =>
		showNotification({
			title: "Coming soon",
			message: "Social sign-in isn’t wired up yet—use email and password for now.",
			color: "gray",
		});

	const dividerStyle = {
		flex: 1,
		borderTopColor: "var(--mantine-color-default-border)",
	} as const;

	return (
		<Stack mt="50px">
			<Flex align="center" gap="md" my="xs">
				<Divider size="xs" style={dividerStyle} />
				<Text
					size="xs"
					tt="uppercase"
					fw={600}
					c="dimmed"
					style={{ letterSpacing: "0.08em" }}
				>
					Or
				</Text>
				<Divider size="xs" style={dividerStyle} />
			</Flex>
			<Group wrap="nowrap" justify="center">
				<Button
					variant="default"
					leftSection={<IconBrandGoogle size={18} />}
					onClick={comingSoon}
				>
					Continue with Google
				</Button>
				<Button
					variant="outline"
					leftSection={<IconBrandApple size={18} />}
					onClick={comingSoon}
				>
					Continue with Apple
				</Button>
			</Group>
		</Stack>
	);
}
