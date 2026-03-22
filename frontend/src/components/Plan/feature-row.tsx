import type { ComponentType } from "react";
import { Group, Stack, Text, ThemeIcon } from "@mantine/core";

export function FeatureRow({
	icon: Icon,
	title,
	description,
}: {
	icon: ComponentType<{ size?: number; stroke?: number }>;
	title: string;
	description: string;
}) {
	return (
		<Group align="flex-start" wrap="nowrap" gap="md">
			<ThemeIcon variant="light" color="mainColor" size="lg" radius="md">
				<Icon size={20} stroke={1.5} />
			</ThemeIcon>
			<Stack gap={4}>
				<Text fw={600}>{title}</Text>
				<Text size="sm" c="dimmed" lh={1.5}>
					{description}
				</Text>
			</Stack>
		</Group>
	);
}
