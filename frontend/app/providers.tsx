"use client";

import type { ReactNode } from "react";
import { CacheProvider } from "@emotion/react";
import { MantineProvider } from "@mantine/core";
import { DatesProvider } from "@mantine/dates";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import createCache from "@emotion/cache";

import { UserProvider } from "@/context/user-context";
import theme from "@/lib/theme";

const cache = createCache({ key: "mantine", prepend: true });

export function Providers({ children }: { children: ReactNode }) {
	return (
		<CacheProvider value={cache}>
			<MantineProvider theme={theme} defaultColorScheme="light">
				<DatesProvider settings={{ locale: "en", firstDayOfWeek: 0 }}>
					<UserProvider>
						<ModalsProvider>
							<Notifications />
							{children}
						</ModalsProvider>
					</UserProvider>
				</DatesProvider>
			</MantineProvider>
		</CacheProvider>
	);
}
