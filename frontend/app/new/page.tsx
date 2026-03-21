"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
	Container,
	Paper,
	Title,
	Stack,
	TextInput,
	NumberInput,
	Select,
	MultiSelect,
	Button,
	Group,
	Alert,
} from "@mantine/core";
import { useForm } from "@mantine/form";

import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/api";
import type { Trip } from "@/lib/trips";

const interestOptions = [
	"Food",
	"Culture",
	"Adventure",
	"Shopping",
	"Nightlife",
	"History",
	"Nature",
	"Art",
	"Sports",
];

export default function NewTripPage() {
	return (
		<RequireAuth>
			<NewTripInner />
		</RequireAuth>
	);
}

function NewTripInner() {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const form = useForm({
		initialValues: {
			destination: "",
			days: 3,
			budgetType: "Medium" as "Low" | "Medium" | "High",
			interests: [] as string[],
		},
		validate: {
			destination: (v) => (v.trim().length >= 2 ? null : "Destination is required"),
			days: (v) => (v >= 1 && v <= 60 ? null : "Days must be between 1 and 60"),
			interests: (v) => (Array.isArray(v) ? null : "Invalid interests"),
		},
	});

	return (
		<Container size={760} style={{ paddingTop: 28, paddingBottom: 40 }}>
			<Paper radius="md" withBorder p="xl">
				<Stack gap="md">
					<Title order={2}>Plan a trip</Title>
					<TextInput
						label="Destination"
						placeholder="e.g., Tokyo, Japan"
						{...form.getInputProps("destination")}
					/>

					<NumberInput
						label="Number of days"
						min={1}
						max={60}
						{...form.getInputProps("days")}
					/>

					<Select
						label="Budget type"
						data={["Low", "Medium", "High"]}
						{...form.getInputProps("budgetType")}
					/>

					<MultiSelect
						label="Interests"
						placeholder="Pick a few..."
						data={interestOptions}
						searchable
						clearable
						{...form.getInputProps("interests")}
					/>

					{error ? <Alert color="red">{error}</Alert> : null}

					<form
						onSubmit={form.onSubmit(async (values) => {
							setError(null);
							setLoading(true);
							try {
								const trip = await api<Trip>("/api/trips", {
									method: "POST",
									body: JSON.stringify(values),
								});
								router.replace(`/trips/${trip._id}`);
							} catch (e) {
								setError(e instanceof Error ? e.message : "Trip generation failed");
							} finally {
								setLoading(false);
							}
						})}
					>
						<Group justify="space-between" mt="md">
							<Button
								type="button"
								variant="subtle"
								onClick={() => router.replace("/dashboard")}
								disabled={loading}
							>
								Back
							</Button>
							<Button type="submit" loading={loading}>
								{loading ? "Generating..." : "Generate itinerary"}
							</Button>
						</Group>
					</form>
				</Stack>
			</Paper>
		</Container>
	);
}
