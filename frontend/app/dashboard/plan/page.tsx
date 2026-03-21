"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
	Alert,
	Badge,
	Button,
	Card,
	Chip,
	Container,
	Divider,
	Group,
	NumberInput,
	SimpleGrid,
	Slider,
	Stack,
	Text,
	TextInput,
	ThemeIcon,
	Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconCalendarEvent, IconMapPin, IconSparkles, IconWallet } from "@tabler/icons-react";

import { BaseApp } from "@/components/BaseApp/base-app";
import RequireAuth from "@/components/Auth/RequireAuth";
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

const budgetTiers = [
	{
		value: "Low" as const,
		title: "Economy",
		hint: "Hostels, local eats, public transport",
	},
	{
		value: "Medium" as const,
		title: "Balanced",
		hint: "Mid-range stays & dining",
	},
	{
		value: "High" as const,
		title: "Premium",
		hint: "Upscale hotels & experiences",
	},
];

function FeatureRow({
	icon: Icon,
	title,
	description,
}: {
	icon: typeof IconSparkles;
	title: string;
	description: string;
}) {
	return (
		<Group align="flex-start" wrap="nowrap" gap="md">
			<ThemeIcon variant="light" color="mainColor" size="lg" radius="md">
				<Icon size={20} stroke={1.5} />
			</ThemeIcon>
			<Stack gap={4}>
				<Text fw={600}>{title}</Text>
				<Text size="sm" c="dimmed" lh={1.5}>
					{description}
				</Text>
			</Stack>
		</Group>
	);
}

export default function PlanTripPage() {
	return (
		<RequireAuth>
			<BaseApp>
				<PlanTripInner />
			</BaseApp>
		</RequireAuth>
	);
}

function PlanTripInner() {
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
		<Container size={1440} mt={50}>
			<SimpleGrid
				cols={{ base: 1, lg: 2 }}
				spacing={{ base: "xl", lg: 48 }}
				verticalSpacing="xl"
			>
				<Stack gap="xl" justify="center" maw={520}>
					<div>
						<Badge variant="light" color="mainColor" size="lg" radius="md" mb="md">
							AI itinerary
						</Badge>
						<Title order={1} fz={{ base: 28, sm: 34 }} lh={1.2}>
							Design a trip that feels like yours
						</Title>
						<Text mt="md" size="lg" c="dimmed" lh={1.6}>
							Tell us where you are going, how long you will stay, and what you
							love—we will sketch days, budgets in INR, and hotel ideas you can refine
							anytime.
						</Text>
					</div>

					<Stack gap="lg">
						<FeatureRow
							icon={IconSparkles}
							title="Built in one pass"
							description="Get a structured itinerary with activities, spend bands, and stay options tailored to your budget tier."
						/>
						<FeatureRow
							icon={IconCalendarEvent}
							title="Day-by-day clarity"
							description="Each day groups a handful of stops so you are never overwhelmed, only inspired."
						/>
						<FeatureRow
							icon={IconWallet}
							title="Rupee-first estimates"
							description="Budget breakdowns are shown in Indian Rupees so planning stays grounded for local spend."
						/>
					</Stack>
				</Stack>

				<Card
					shadow="md"
					p="xl"
					radius="lg"
					withBorder
					style={{
						borderColor:
							"light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))",
					}}
				>
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
						<Stack gap="lg">
							<div>
								<Title order={3}>Trip details</Title>
								<Text size="sm" c="dimmed" mt={6}>
									Required fields are validated before we call the planner.
								</Text>
							</div>

							<TextInput
								label="Destination"
								description="City, region, or country"
								placeholder="e.g. Kochi, Japan, Swiss Alps"
								leftSection={<IconMapPin size={18} stroke={1.5} aria-hidden />}
								size="md"
								{...form.getInputProps("destination")}
							/>

							<div>
								<Group justify="space-between" mb={6}>
									<Text
										component="label"
										size="sm"
										fw={500}
										htmlFor="plan-days-slider"
									>
										Trip length
									</Text>
									<NumberInput
										hideControls
										min={1}
										max={60}
										size="xs"
										w={72}
										{...form.getInputProps("days")}
									/>
								</Group>
								<Slider
									id="plan-days-slider"
									min={1}
									max={60}
									step={1}
									value={form.values.days}
									onChange={(v) => form.setFieldValue("days", v)}
									color="mainColor"
									mb="xs"
								/>
								<Text size="xs" c="dimmed">
									Drag or type a value from 1–60 days.
								</Text>
							</div>

							<div>
								<Text size="sm" fw={500} mb="xs">
									Budget style
								</Text>
								<SimpleGrid cols={{ base: 1, xs: 3 }} spacing="sm">
									{budgetTiers.map((tier) => {
										const selected = form.values.budgetType === tier.value;
										return (
											<Card
												key={tier.value}
												component="button"
												type="button"
												withBorder
												padding="sm"
												radius="md"
												onClick={() =>
													form.setFieldValue("budgetType", tier.value)
												}
												style={{
													cursor: "pointer",
													textAlign: "left",
													transition:
														"border-color 120ms ease, box-shadow 120ms ease",
													borderColor: selected
														? "var(--mantine-color-mainColor-filled)"
														: undefined,
													boxShadow: selected
														? "var(--mantine-shadow-sm)"
														: undefined,
													background: selected
														? "light-dark(var(--mantine-color-mainColor-0), rgba(32, 159, 158, 0.12))"
														: undefined,
												}}
											>
												<Text fw={700} size="sm">
													{tier.title}
												</Text>
												<Text size="xs" c="dimmed" mt={4} lh={1.45}>
													{tier.hint}
												</Text>
											</Card>
										);
									})}
								</SimpleGrid>
							</div>

							<div>
								<Text size="sm" fw={500} mb="xs">
									Interests
								</Text>
								<Text size="xs" c="dimmed" mb="sm">
									Choose a few—we will weight activities toward these themes.
								</Text>
								<Chip.Group
									multiple
									value={form.values.interests}
									onChange={(v) => form.setFieldValue("interests", v)}
								>
									<Group gap="xs">
										{interestOptions.map((opt) => (
											<Chip
												key={opt}
												value={opt}
												variant="light"
												color="mainColor"
											>
												{opt}
											</Chip>
										))}
									</Group>
								</Chip.Group>
							</div>

							{error ? (
								<Alert color="red" variant="light">
									{error}
								</Alert>
							) : null}

							<Divider />

							<Group justify="space-between" align="center" wrap="wrap">
								<Button
									type="button"
									variant="subtle"
									color="gray"
									onClick={() => router.replace("/dashboard")}
									disabled={loading}
								>
									Back
								</Button>
								<Button
									type="submit"
									loading={loading}
									size="md"
									variant="gradient"
									gradient={{ from: "teal", to: "cyan", deg: 105 }}
								>
									{loading ? "Generating…" : "Generate itinerary"}
								</Button>
							</Group>
						</Stack>
					</form>
				</Card>
			</SimpleGrid>
		</Container>
	);
}
