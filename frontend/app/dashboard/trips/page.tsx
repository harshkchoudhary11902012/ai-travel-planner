"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
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

import { BaseApp } from "@/components/BaseApp/base-app";
import RequireAuth from "@/components/Auth/RequireAuth";
import type { Trip } from "@/lib/trips";
import { listTrips } from "@/lib/trips";

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
								<Table.Th style={{ width: 120 }} />
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
										<Button
											component={Link}
											href={`/trips/${trip._id}`}
											variant="light"
											size="xs"
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
		</Container>
	);
}
