"use client";

import type { ReactNode } from "react";
import { CacheProvider } from "@emotion/react";
import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import createCache from "@emotion/cache";

import { ThemeToggle } from "@/theme/ThemeToggle";
import theme from "@/theme/theme";

const cache = createCache({ key: "mantine", prepend: true });

export function Providers({ children }: { children: ReactNode }) {
	return (
		<CacheProvider value={cache}>
			<MantineProvider theme={theme} defaultColorScheme="light">
				<ModalsProvider>
					<Notifications />
					<ThemeToggle />
					{children}
				</ModalsProvider>
			</MantineProvider>
		</CacheProvider>
	);
}
