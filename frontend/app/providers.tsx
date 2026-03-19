"use client";

import type { ReactNode } from "react";
import { CacheProvider } from "@emotion/react";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { ModalsProvider } from "@mantine/modals";
import createCache from "@emotion/cache";

const cache = createCache({ key: "mantine", prepend: true });

export function Providers({ children }: { children: ReactNode }) {
	return (
		<CacheProvider value={cache}>
			<MantineProvider>
				<ModalsProvider>
					<Notifications />
					{children}
				</ModalsProvider>
			</MantineProvider>
		</CacheProvider>
	);
}
