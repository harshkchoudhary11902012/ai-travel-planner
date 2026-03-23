"use client";

import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";
import {
	Badge,
	Box,
	Grid,
	Group,
	Paper,
	Text,
	Title,
	UnstyledButton,
	useMantineTheme,
} from "@mantine/core";
import { IconPlane, IconSparkles } from "@tabler/icons-react";

export type HeroSlide = {
	src: string;
	title: string;
	description?: string;
};

const DEFAULT_SLIDES: HeroSlide[] = [
	{
		src: "https://images.unsplash.com/photo-1773758706361-ca25411b065a?q=80&w=927&auto=format&fit=crop",
		title: "Designed around your dreams",
		description: "Tailor-made trips start with your preferences and grow with every edit.",
	},
	{
		src: "https://images.unsplash.com/photo-1772616983875-03ca7293c933?q=80&w=927&auto=format&fit=crop",
		title: "Join thousands of travelers worldwide",
		description: "Discover itineraries, budgets, and stays—refined by AI, controlled by you.",
	},
	{
		src: "https://images.unsplash.com/photo-1557093793-d149a38a1be8?q=80&w=1287&auto=format&fit=crop",
		title: "Every horizon, within reach",
		description: "From weekend escapes to multi-week routes—plan calmly in one workspace.",
	},
];

export type LoginPageContainerProps = {
	children: ReactNode;
	slides?: HeroSlide[];
	backHref?: string;
	backLabel?: string;
};

export function LoginPageContainer({ children, slides = DEFAULT_SLIDES }: LoginPageContainerProps) {
	const theme = useMantineTheme();
	const [active, setActive] = useState(0);
	const safeSlides = slides.length > 0 ? slides : DEFAULT_SLIDES;

	const primary = theme.colors[theme.primaryColor] ?? theme.colors.teal;

	useEffect(() => {
		if (safeSlides.length <= 1) return;
		const t = setInterval(() => {
			setActive((i) => (i + 1) % safeSlides.length);
		}, 6500);
		return () => clearInterval(t);
	}, [safeSlides.length]);

	const slide = safeSlides[active]!;

	return (
		<Box
			display="flex"
			mih="100dvh"
			p={{ base: 12, xs: 16, sm: 24, md: 40, lg: 50 }}
			style={{ alignItems: "stretch" }}
		>
			<Grid
				maw={1280}
				mx="auto"
				miw={0}
				w="100%"
				align="stretch"
				styles={{
					inner: {
						height: "100%",
						"@media (max-width: 61.9375em)": {
							height: "auto",
						},
					},
				}}
			>
				<Grid.Col span={{ base: 12, md: 6 }} order={{ base: 2, md: 1 }}>
					<Paper
						p={{ base: "md", sm: "lg", md: "xl" }}
						radius="xl"
						shadow="md"
						withBorder
						miw={0}
						w="100%"
						h={{ base: "auto", md: "100%" }}
					>
						<Group justify="space-between" wrap="wrap" gap="sm">
							<Group wrap="nowrap">
								<Box
									w={40}
									h={40}
									bg={`linear-gradient(145deg, ${primary[7]} 0%, ${primary[8]} 100%)`}
									display="flex"
									color={theme.white}
									style={{
										alignItems: "center",
										justifyContent: "center",
										color: theme.white,
										borderRadius: 10,
									}}
									aria-hidden
								>
									<IconPlane size={22} stroke={1.8} />
								</Box>
								<Text fw={800} fz={18}>
									AI Travel Planner
								</Text>
							</Group>

							<Badge
								variant="light"
								color={theme.primaryColor}
								radius="xl"
								leftSection={<IconSparkles size={12} stroke={2} aria-hidden />}
							>
								Powered by AI
							</Badge>
						</Group>

						<Box
							mt="xl"
							style={{
								flex: 1,
								minHeight: 0,
								display: "flex",
								flexDirection: "column",
								overflow: "auto",
							}}
						>
							{children}
						</Box>

						<Text size="xs" ta="center" pt="md" c="dimmed">
							By continuing, you agree to our Terms of Service and Privacy Policy
						</Text>
					</Paper>
				</Grid.Col>

				<Grid.Col span={{ base: 12, md: 6 }} order={{ base: 1, md: 2 }}>
					<Paper
						radius="xl"
						h={{ base: 240, sm: 280, md: "100%" }}
						pos="relative"
						style={{ overflow: "hidden" }}
					>
						<Image src={slide.src} alt="" fill />
						<Box
							style={{
								position: "absolute",
								inset: 0,
								zIndex: 1,
								background:
									"linear-gradient(to top, rgba(15, 23, 42, 0.82) 0%, rgba(15, 23, 42, 0.25) 42%, transparent 72%)",
								pointerEvents: "none",
							}}
						/>
						<Box
							p={{ base: 16, sm: 24, md: 40 }}
							pr={{ base: 48, md: 40 }}
							pos="absolute"
							left={0}
							bottom={0}
							style={{ zIndex: 2 }}
						>
							<Title order={2} c="white" lineClamp={3} fz={{ base: "h4", sm: "h3" }}>
								{slide.title}
							</Title>
							{slide.description ? (
								<Text c="white" mt="sm" size="sm" lineClamp={2} fz={{ base: "xs", sm: "sm" }}>
									{slide.description}
								</Text>
							) : null}
						</Box>
						{safeSlides.length > 1 ? (
							<Group
								style={{
									position: "absolute",
									zIndex: 3,
									bottom: 20,
									left: "50%",
									transform: "translateX(-50%)",
								}}
							>
								{safeSlides.map((_, i) => (
									<UnstyledButton
										key={i}
										type="button"
										aria-label={`Show slide ${i + 1}`}
										aria-current={i === active ? "true" : undefined}
										onClick={() => setActive(i)}
										style={{
											width: 8,
											height: 8,
											borderRadius: "50%",
											background:
												i === active
													? theme.white
													: "rgba(255, 255, 255, 0.35)",
										}}
									/>
								))}
							</Group>
						) : null}
					</Paper>
				</Grid.Col>
			</Grid>
		</Box>
	);
}
