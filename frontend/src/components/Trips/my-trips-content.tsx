"use client";

import Link from "next/link";
import {
	ActionIcon,
	Alert,
	Badge,
	Button,
	Center,
	Container,
	Group,
	Loader,
	Paper,
	Stack,
	Table,
	Text,
	Title,
} from "@mantine/core";
import { IconEye, IconTrash } from "@tabler/icons-react";

import { useMyTrips } from "@/features/trips";
import { budgetTypeBadgeColor } from "@/lib/budget-type";

export function MyTripsContent() {
	const { trips, error, deletingId, confirmDeleteTrip } = useMyTrips();

	if (trips === null) {
		return (
			<Center style={{ minHeight: 280 }}>
				<Loader />
			</Center>
		);
	}

	return (
		<Container size={1440}>
			<Group justify="space-between" align="flex-start" mb="lg">
				<Stack gap={4}>
					<Title order={2}>My trips</Title>
					<Text size="sm" c="dimmed">
						Open a trip to view AI itinerary, budget breakdown, hotel ideas, and edits.
					</Text>
				</Stack>
				<Button component={Link} href="/dashboard/plan">
					Plan new trip
				</Button>
			</Group>

			{error ? (
				<Alert color="red" mb="md">
					{error}
				</Alert>
			) : null}

			{trips.length === 0 ? (
				<Paper withBorder p="xl" radius="md">
					<Stack gap="md" align="flex-start">
						<Text c="dimmed">
							You have no trips yet. Start with destination, dates, and interests.
						</Text>
						<Button component={Link} href="/dashboard/plan">
							Create your first trip
						</Button>
					</Stack>
				</Paper>
			) : (
				<Paper withBorder radius="md" style={{ overflow: "auto" }}>
					<Table striped highlightOnHover verticalSpacing="sm">
						<Table.Thead>
							<Table.Tr>
								<Table.Th>Destination</Table.Th>
								<Table.Th>Duration</Table.Th>
								<Table.Th>Budget</Table.Th>
								<Table.Th>Interests</Table.Th>
								<Table.Th>Status</Table.Th>
								<Table.Th style={{ width: 120 }}>Actions</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{trips.map((trip) => (
								<Table.Tr key={trip._id}>
									<Table.Td>
										<Text fw={600}>{trip.destination}</Text>
									</Table.Td>
									<Table.Td>
										<Text size="sm">{trip.days} days</Text>
									</Table.Td>
									<Table.Td>
										<Badge variant="light" color={budgetTypeBadgeColor(trip.budgetType)}>
											{trip.budgetType}
										</Badge>
									</Table.Td>
									<Table.Td>
										<Text size="sm" lineClamp={2} maw={280}>
											{(trip.interests || []).join(", ") || "—"}
										</Text>
									</Table.Td>
									<Table.Td>
										<Badge variant="light" color="teal">
											Open
										</Badge>
									</Table.Td>
									<Table.Td>
										<Group gap={4} wrap="nowrap">
											<ActionIcon
												component={Link}
												href={`/trips/${trip._id}`}
												variant="subtle"
												color="mainColor"
												aria-label={`Open ${trip.destination}`}
											>
												<IconEye size={18} stroke={1.5} />
											</ActionIcon>
											<ActionIcon
												variant="subtle"
												color="red"
												aria-label={`Delete ${trip.destination}`}
												loading={deletingId === trip._id}
												disabled={deletingId !== null && deletingId !== trip._id}
												onClick={() => confirmDeleteTrip(trip)}
											>
												<IconTrash size={18} stroke={1.5} />
											</ActionIcon>
										</Group>
									</Table.Td>
								</Table.Tr>
							))}
						</Table.Tbody>
					</Table>
				</Paper>
			)}
		</Container>
	);
}
