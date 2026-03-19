"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
	Container,
	Stack,
	Title,
	Button,
	Card,
	Text,
	Group,
	Badge,
	Loader,
	Center,
} from "@mantine/core";

import { showNotification } from "@mantine/notifications";

import RequireAuth from "@/components/Auth/RequireAuth";
import { api } from "@/lib/api";
import { logout } from "@/lib/auth";

type Trip = {
	_id: string;
	destination: string;
	days: number;
	budgetType: "Low" | "Medium" | "High";
	budget: { total: number };
};

export default function DashboardPage() {
	return (
		<RequireAuth>
			<DashboardInner />
		</RequireAuth>
	);
}

function DashboardInner() {
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [trips, setTrips] = useState<Trip[]>([]);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			setLoading(true);
			try {
				const data = await api<Trip[]>("/api/trips", { method: "GET" });
				if (!cancelled) setTrips(data);
			} catch {
				// RequireAuth already handles redirect.
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	if (loading) {
		return (
			<Center style={{ minHeight: 220 }}>
				<Loader />
			</Center>
		);
	}

	return (
		<Container size={980} style={{ paddingTop: 28, paddingBottom: 40 }}>
			<Group justify="space-between" align="center" mb="md">
				<Title order={2}>Your trips</Title>
				<Group>
					<Button variant="subtle" onClick={() => router.push("/new")}>
						New trip
					</Button>
					<Button
						variant="outline"
						color="red"
						onClick={() => {
							showNotification({
								title: "Successfully logged out",
								message: "See you next time.",
								color: "orange",
								position: "top-center",
								autoClose: 5000,
								withCloseButton: true,
							});
							logout();
							router.replace("/");
						}}
					>
						Log out
					</Button>
				</Group>
			</Group>

			{trips.length === 0 ? (
				<Card withBorder p="xl">
					<Stack gap="xs">
						<Text>No trips yet.</Text>
						<Text color="dimmed" size="sm">
							Create your first itinerary.
						</Text>
						<Button mt="sm" onClick={() => router.push("/new")}>
							Create trip
						</Button>
					</Stack>
				</Card>
			) : (
				<Stack gap="md">
					{trips.map((t) => (
						<Card key={t._id} withBorder padding="lg">
							<Group justify="space-between" align="flex-start">
								<Stack gap={2}>
									<Title order={3}>{t.destination}</Title>
									<Text color="dimmed" size="sm">
										{t.days} day(s)
									</Text>
									<Group gap={8}>
										<Badge>{t.budgetType} budget</Badge>
										<Badge variant="light">Total: ${t.budget.total}</Badge>
									</Group>
								</Stack>
								<Button onClick={() => router.push(`/trips/${t._id}`)}>Open</Button>
							</Group>
						</Card>
					))}
				</Stack>
			)}
		</Container>
	);
}
