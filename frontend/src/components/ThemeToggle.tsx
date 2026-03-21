"use client";

import { ActionIcon, Tooltip, useComputedColorScheme, useMantineColorScheme } from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";

export function ThemeToggle() {
	const { setColorScheme } = useMantineColorScheme();
	const computed = useComputedColorScheme("light", { getInitialValueInEffect: true });
	const isDark = computed === "dark";

	return (
		<Tooltip label={isDark ? "Switch to light mode" : "Switch to dark mode"} position="left">
			<ActionIcon
				onClick={() => setColorScheme(isDark ? "light" : "dark")}
				variant="default"
				size="lg"
				radius="xl"
				styles={{
					root: {
						position: "fixed",
						top: 16,
						right: 16,
						boxShadow: "0 4px 18px rgba(0, 0, 0, 0.12)",
					},
				}}
			>
				{isDark ? (
					<IconSun size={20} stroke={1.75} />
				) : (
					<IconMoon size={20} stroke={1.75} />
				)}
			</ActionIcon>
		</Tooltip>
	);
}
