"use client";

import { useRouter } from "next/navigation";
import {
	Alert,
	Badge,
	Button,
	Card,
	Center,
	Container,
	Grid,
	Group,
	Loader,
	SimpleGrid,
	Stack,
	Text,
	Title,
} from "@mantine/core";

import DayPanel from "@/components/Trip/DayPanel";
import RevisionPanel from "@/components/Trip/RevisionPanel";
import { useTripDetail } from "@/features/trip-detail/use-trip-detail";
import { budgetTypeBadgeColor } from "@/lib/budget-type";
import { formatINR } from "@/lib/currency";

export function TripDetailContent({ tripId }: { tripId: string }) {
	const router = useRouter();
	const {
		loading,
		saving,
		error,
		trip,
		revisions,
		revisionsLoading,
		orderedDays,
		handleMutation,
	} = useTripDetail(tripId);

	if (loading || !trip) {
		return (
			<Center style={{ minHeight: 320 }}>
				<Loader />
			</Center>
		);
	}

	return (
		<Container
			size={1440}
			px={{ base: "xs", sm: "md" }}
			py={{ base: 16, sm: 24 }}
			style={{ paddingBottom: 60 }}
		>
			<Group justify="space-between" align="flex-start" wrap="wrap" gap="sm" mb="md">
				<Stack gap={4} miw={0} style={{ flex: "1 1 min(100%, 320px)" }}>
					<Title order={2} lineClamp={3}>
						Trip: {trip.destination}
					</Title>
					<Group gap="xs" wrap="wrap">
						<Badge>{trip.days} day(s)</Badge>
						<Badge variant="light" color={budgetTypeBadgeColor(trip.budgetType)}>
							{trip.budgetType} budget
						</Badge>
					</Group>
				</Stack>
				<Button
					variant="light"
					w={{ base: "100%", sm: "auto" }}
					onClick={() => router.replace("/dashboard/trips")}
					disabled={saving}
				>
					Back
				</Button>
			</Group>

			{error ? (
				<Alert color="red" mb="md">
					{error}
				</Alert>
			) : null}

			<Grid gutter={{ base: "md", md: "xl" }} align="start">
				<Grid.Col span={{ base: 12, lg: 8 }}>
					<Card withBorder p={{ base: "sm", sm: "md" }} radius="md" mb="md">
						<Stack gap="xs">
							<Text fw={700}>Estimated budget</Text>
							<SimpleGrid
								cols={{ base: 1, sm: 2 }}
								spacing={{ base: "xs", sm: "md" }}
							>
								<Text size="sm" color="dimmed">
									Flights: {formatINR(trip.budget.flights)}
								</Text>
								<Text size="sm" color="dimmed">
									Accommodation: {formatINR(trip.budget.accommodation)}
								</Text>
								<Text size="sm" color="dimmed">
									Food: {formatINR(trip.budget.food)}
								</Text>
								<Text size="sm" color="dimmed">
									Activities: {formatINR(trip.budget.activities)}
								</Text>
							</SimpleGrid>
							<Text size="lg" fw={800}>
								Total: {formatINR(trip.budget.total)}
							</Text>
						</Stack>
					</Card>

					<Card withBorder p={{ base: "sm", sm: "md" }} radius="md" mb="md">
						<Stack gap="xs">
							<Text fw={700}>Recommended hotels</Text>
							<Grid gutter={{ base: "xs", sm: 8 }}>
								{trip.hotels.map((h, idx) => (
									<Grid.Col span={{ base: 12, sm: 6 }} key={`${h.name}-${idx}`}>
										<Card shadow="none" padding="sm" radius="md" withBorder>
											<Stack gap={2}>
												<Text fw={700}>{h.name}</Text>
												{h.neighborhood ? (
													<Text size="sm" color="dimmed">
														{h.neighborhood}
													</Text>
												) : null}
												{typeof h.rating === "number" ? (
													<Text size="sm">
														Rating: {h.rating.toFixed(1)}/5
													</Text>
												) : (
													<Text size="sm" color="dimmed">
														Rating: N/A
													</Text>
												)}
												{h.priceTier ? (
													<Text size="sm" color="dimmed">
														{h.priceTier} tier
													</Text>
												) : null}
											</Stack>
										</Card>
									</Grid.Col>
								))}
							</Grid>
						</Stack>
					</Card>

					<Stack gap="md">
						{orderedDays.map((day) => (
							<DayPanel
								key={day.dayNumber}
								tripId={trip._id}
								day={day}
								budgetType={trip.budgetType}
								onMutation={handleMutation}
							/>
						))}
					</Stack>
				</Grid.Col>

				<Grid.Col span={{ base: 12, lg: 4 }}>
					<RevisionPanel
						tripId={trip._id}
						revisions={revisions}
						onRestored={handleMutation}
						loading={revisionsLoading}
					/>
				</Grid.Col>
			</Grid>
		</Container>
	);
}
