"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { modals } from "@mantine/modals";
import { showNotification } from "@mantine/notifications";
import { IconEye, IconTrash } from "@tabler/icons-react";

import { BaseApp } from "@/components/BaseApp/base-app";
import RequireAuth from "@/components/Auth/RequireAuth";
import type { Trip } from "@/lib/trips";
import { deleteTrip, listTrips } from "@/lib/trips";

export default function MyTripsPage() {
	return (
		<RequireAuth>
			<BaseApp>
				<MyTripsInner />
			</BaseApp>
		</RequireAuth>
	);
}

function MyTripsInner() {
	const router = useRouter();
	const [trips, setTrips] = useState<Trip[] | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [deletingId, setDeletingId] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		listTrips()
			.then((data) => {
				if (!cancelled) setTrips(data);
			})
			.catch((e) => {
				if (!cancelled) {
					setError(e instanceof Error ? e.message : "Failed to load trips");
					setTrips([]);
				}
			});
		return () => {
			cancelled = true;
		};
	}, []);

	function confirmDeleteTrip(trip: Trip) {
		modals.openConfirmModal({
			title: "Delete trip permanently?",
			children: (
				<Text size="sm">
					This removes <strong>{trip.destination}</strong> and its revision history. You cannot undo
					this.
				</Text>
			),
			labels: { confirm: "Delete", cancel: "Cancel" },
			confirmProps: { color: "red" },
			onConfirm: async () => {
				setDeletingId(trip._id);
				try {
					await deleteTrip(trip._id);
					setTrips((prev) => (prev ? prev.filter((t) => t._id !== trip._id) : prev));
					showNotification({
						title: "Trip deleted",
						message: `${trip.destination} was removed.`,
						color: "orange",
						position: "top-center",
					});
				} catch (e) {
					showNotification({
						title: "Could not delete trip",
						message: e instanceof Error ? e.message : "Request failed",
						color: "red",
						position: "top-center",
					});
				} finally {
					setDeletingId(null);
				}
			},
		});
	}

	if (trips === null) {
		return (
			<Center style={{ minHeight: 280 }}>
				<Loader />
			</Center>
		);
	}

	return (
		<Container size="lg">
			<Group justify="space-between" align="flex-start" mb="lg">
				<Stack gap={4}>
					<Title order={2}>My trips</Title>
					<Text size="sm" c="dimmed">
						Open a trip to view AI itinerary, budget breakdown, hotel ideas, and edits.
					</Text>
				</Stack>
				<Button onClick={() => router.push("/dashboard/plan")}>Plan new trip</Button>
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
										<Badge variant="light">{trip.budgetType}</Badge>
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
												variant="subtle"
												color="mainColor"
												aria-label={`Open ${trip.destination}`}
												onClick={() => router.push(`/trips/${trip._id}`)}
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
