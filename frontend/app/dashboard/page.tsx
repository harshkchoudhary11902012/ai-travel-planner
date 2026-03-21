"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
	Badge,
	Button,
	Card,
	Center,
	Container,
	Grid,
	Group,
	Loader,
	Paper,
	RingProgress,
	SimpleGrid,
	Stack,
	Table,
	Text,
	ThemeIcon,
	Title,
	rem,
} from "@mantine/core";
import { Calendar } from "@mantine/dates";
import {
	IconBed,
	IconCalendarEvent,
	IconCoin,
	IconListDetails,
	IconMapRoute,
	IconSparkles,
} from "@tabler/icons-react";
import dayjs from "dayjs";

import { BaseApp } from "@/components/BaseApp/base-app";
import RequireAuth from "@/components/Auth/RequireAuth";
import { DestinationOffersTabs } from "@/components/Dashboard/destination-offers-tabs";
import { useUser } from "@/context/user-context";
import { budgetTypeBadgeColor } from "@/lib/budget-type";
import type { Trip } from "@/lib/trips";
import { listTrips } from "@/lib/trips";
import { displayFirstName } from "@/lib/user-display";

export default function DashboardPage() {
	return (
		<RequireAuth>
			<BaseApp>
				<DashboardInner />
			</BaseApp>
		</RequireAuth>
	);
}

function DashboardInner() {
	const { user, loading: userLoading } = useUser();
	const [trips, setTrips] = useState<Trip[] | null>(null);

	useEffect(() => {
		let cancelled = false;
		listTrips()
			.then((data) => {
				if (!cancelled) setTrips(data);
			})
			.catch(() => {
				if (!cancelled) setTrips([]);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	if (userLoading || trips === null) {
		return (
			<Center style={{ minHeight: 240 }}>
				<Loader />
			</Center>
		);
	}

	const tripCount = trips.length;
	const activityTotal = trips.reduce((sum, t) => {
		const days = t.itinerary || [];
		return sum + days.reduce((dSum, d) => dSum + (d.activities?.length || 0), 0);
	}, 0);
	const recent = trips.slice(0, 5);

	return (
		<Container size={1440}>
			<Stack gap="xl">
				<div>
					<Title order={2} mb={6}>
						Hello {user ? displayFirstName(user) : "there"} 👋,
					</Title>
					<Text c="dimmed" size="sm">
						Overview of your workspace: plan trips, review AI output, and manage
						itineraries in one place.
					</Text>
				</div>

				<SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
					<Card withBorder padding="lg" radius="md">
						<Group justify="space-between" wrap="nowrap">
							<div>
								<Text size="xs" c="dimmed" tt="uppercase" fw={600}>
									Trips
								</Text>
								<Text size="xl" fw={800} lh={1.2}>
									{tripCount}
								</Text>
								<Text size="sm" c="dimmed">
									Saved for your account
								</Text>
							</div>
							<ThemeIcon size={48} radius="md" variant="light" color="mainColor">
								<IconMapRoute size={26} stroke={1.5} />
							</ThemeIcon>
						</Group>
					</Card>
					<Card withBorder padding="lg" radius="md">
						<Group justify="space-between" wrap="nowrap">
							<div>
								<Text size="xs" c="dimmed" tt="uppercase" fw={600}>
									Activities
								</Text>
								<Text size="xl" fw={800} lh={1.2}>
									{activityTotal}
								</Text>
								<Text size="sm" c="dimmed">
									Across all itineraries
								</Text>
							</div>
							<ThemeIcon size={48} radius="md" variant="light" color="cyan">
								<IconListDetails size={26} stroke={1.5} />
							</ThemeIcon>
						</Group>
					</Card>
					<Card withBorder padding="lg" radius="md">
						<Group justify="space-between" wrap="nowrap" align="center">
							<Stack gap={4}>
								<Text size="xs" c="dimmed" tt="uppercase" fw={600}>
									Next step
								</Text>
								<Text size="sm" fw={600}>
									{tripCount === 0 ? "Create a trip" : "Plan or open a trip"}
								</Text>
							</Stack>
							<RingProgress
								size={56}
								thickness={6}
								sections={[
									{ value: tripCount === 0 ? 15 : 100, color: "mainColor" },
								]}
								label={
									<Text size="xs" fw={700} ta="center">
										{tripCount === 0 ? "!" : "OK"}
									</Text>
								}
							/>
						</Group>
					</Card>
				</SimpleGrid>

				<Grid align="flex-start">
					<Grid.Col span={{ base: 12, md: 3 }}>
						<Stack gap="md">
							<Paper withBorder p="md" radius="md" h="100%">
								<Stack gap="sm">
									<Title order={4}>Calendar</Title>
									<Calendar
										size="md"
										highlightToday
										minLevel="month"
										maxLevel="month"
										defaultDate={dayjs().format("YYYY-MM-DD")}
									/>
								</Stack>
							</Paper>
							<Stack gap="md" mt={30}>
								<Group justify="space-between" wrap="nowrap">
									<Title order={4}>Recent trips</Title>
									<Button
										component={Link}
										href="/dashboard/trips"
										variant="subtle"
										size="xs"
									>
										View all
									</Button>
								</Group>
								{recent.length === 0 ? (
									<Paper withBorder p="md" radius="md" h={140}>
										<Text size="md" c="dimmed" mb="lg">
											No trips yet.
										</Text>
										<Button
											component={Link}
											href="/dashboard/plan"
											fullWidth
											size="md"
										>
											Start planning
										</Button>
									</Paper>
								) : (
									<Paper
										withBorder
										radius="md"
										style={{
											overflow: "auto",
											maxHeight: rem(200),
										}}
									>
										<Table verticalSpacing="xs" horizontalSpacing="sm">
											<Table.Tbody>
												{recent.map((t) => (
													<Table.Tr key={t._id}>
														<Table.Td>
															<Text size="sm" fw={600} lineClamp={1}>
																{t.destination}
															</Text>
															<Group gap={6} mt={4}>
																<Badge size="xs" variant="light">
																	{t.days}d
																</Badge>
																<Badge
																	size="xs"
																	variant="light"
																	color={budgetTypeBadgeColor(t.budgetType)}
																>
																	{t.budgetType}
																</Badge>
															</Group>
														</Table.Td>
														<Table.Td style={{ width: 72 }}>
															<Button
																component={Link}
																href={`/trips/${t._id}`}
																size="compact-xs"
																variant="light"
															>
																Open
															</Button>
														</Table.Td>
													</Table.Tr>
												))}
											</Table.Tbody>
										</Table>
									</Paper>
								)}
							</Stack>
						</Stack>
					</Grid.Col>
					<Grid.Col span={{ base: 12, md: 9 }}>
						<DestinationOffersTabs />
					</Grid.Col>
				</Grid>

				<Grid gutter="md">
					<Grid.Col span={12}>
						<Stack gap="md">
							<Title order={4}>Quick actions</Title>
							<SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
								<Card
									component={Link}
									href="/dashboard/plan"
									withBorder
									padding="lg"
									radius="md"
									style={{ textDecoration: "none", color: "inherit" }}
								>
									<Group wrap="nowrap" align="flex-start">
										<ThemeIcon
											size={42}
											radius="md"
											variant="light"
											color="mainColor"
										>
											<IconSparkles size={22} stroke={1.5} />
										</ThemeIcon>
										<Stack gap={4}>
											<Text fw={700}>Plan a trip</Text>
											<Text size="sm" c="dimmed">
												Destination, days, budget tier, and interests — then
												generate a day-by-day itinerary.
											</Text>
										</Stack>
									</Group>
								</Card>
								<Card
									component={Link}
									href="/dashboard/trips"
									withBorder
									padding="lg"
									radius="md"
									style={{ textDecoration: "none", color: "inherit" }}
								>
									<Group wrap="nowrap" align="flex-start">
										<ThemeIcon
											size={42}
											radius="md"
											variant="light"
											color="grape"
										>
											<IconCalendarEvent size={22} stroke={1.5} />
										</ThemeIcon>
										<Stack gap={4}>
											<Text fw={700}>My trips</Text>
											<Text size="sm" c="dimmed">
												Browse saved plans. Each trip holds itinerary edits,
												revisions, and history.
											</Text>
										</Stack>
									</Group>
								</Card>
								<Card withBorder padding="lg" radius="md">
									<Group wrap="nowrap" align="flex-start">
										<ThemeIcon
											size={42}
											radius="md"
											variant="light"
											color="yellow"
										>
											<IconCoin size={22} stroke={1.5} />
										</ThemeIcon>
										<Stack gap={4}>
											<Text fw={700}>Budget estimates</Text>
											<Text size="sm" c="dimmed">
												Flights, stay, food, and activities are estimated
												per trip after generation. Open any trip to see the
												breakdown.
											</Text>
										</Stack>
									</Group>
								</Card>
								<Card withBorder padding="lg" radius="md">
									<Group wrap="nowrap" align="flex-start">
										<ThemeIcon
											size={42}
											radius="md"
											variant="light"
											color="blue"
										>
											<IconBed size={22} stroke={1.5} />
										</ThemeIcon>
										<Stack gap={4}>
											<Text fw={700}>Hotel suggestions</Text>
											<Text size="sm" c="dimmed">
												AI-suggested stays by destination and budget appear
												on each trip detail page.
											</Text>
										</Stack>
									</Group>
								</Card>
							</SimpleGrid>
						</Stack>
					</Grid.Col>
				</Grid>
			</Stack>
		</Container>
	);
}
