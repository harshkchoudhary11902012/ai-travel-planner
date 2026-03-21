"use client";

import { useState } from "react";
import {
	Accordion,
	ActionIcon,
	Badge,
	Box,
	Button,
	Group,
	Stack,
	Text,
	Textarea,
	TextInput,
} from "@mantine/core";

import { budgetTypeBadgeColor } from "@/lib/budget-type";
import type { TripDay } from "@/lib/trips";
import { addActivity, regenerateDay, removeActivity } from "@/lib/trips";

import { modals } from "@mantine/modals";
import { IconTrash, IconSparkles, IconPlus } from "@tabler/icons-react";

export default function DayPanel({
	tripId,
	day,
	budgetType,
	onMutation,
}: {
	tripId: string;
	day: TripDay;
	budgetType: "Low" | "Medium" | "High";
	onMutation: () => void;
}) {
	const [instruction, setInstruction] = useState("");
	const [regenLoading, setRegenLoading] = useState(false);

	const [newTitle, setNewTitle] = useState("");
	const [newNotes, setNewNotes] = useState("");
	const [addLoading, setAddLoading] = useState(false);

	async function handleRegenerate() {
		const inst = instruction.trim();
		if (inst.length < 3) return;
		setRegenLoading(true);
		try {
			await regenerateDay(tripId, day.dayNumber, inst);
			setInstruction("");
			onMutation();
		} finally {
			setRegenLoading(false);
		}
	}

	async function handleAdd() {
		const title = newTitle.trim();
		if (!title) return;
		setAddLoading(true);
		try {
			await addActivity(tripId, day.dayNumber, { title, notes: newNotes });
			setNewTitle("");
			setNewNotes("");
			onMutation();
		} finally {
			setAddLoading(false);
		}
	}

	async function handleRemove(activityId: string) {
		modals.openConfirmModal({
			title: "Remove activity?",
			children: (
				<Text size="sm">This updates your itinerary and adds a revision snapshot.</Text>
			),
			labels: { confirm: "Remove", cancel: "Cancel" },
			confirmProps: { color: "red" },
			onConfirm: async () => {
				await removeActivity(tripId, day.dayNumber, activityId);
				onMutation();
			},
		});
	}

	return (
		<Accordion chevronPosition="left" variant="contained" defaultValue={`day-${day.dayNumber}`}>
			<Accordion.Item value={`day-${day.dayNumber}`} key={day.dayNumber}>
				<Accordion.Control>
					<Group gap="sm">
						<Text fw={700}>Day {day.dayNumber}</Text>
						<Badge variant="light">{day.activities.length} activities</Badge>
						<Badge variant="light" color={budgetTypeBadgeColor(budgetType)}>
							{budgetType}
						</Badge>
					</Group>
				</Accordion.Control>
				<Accordion.Panel>
					<Stack gap="md">
						<Stack gap={8}>
							{day.activities.length === 0 ? (
								<Text color="dimmed" size="sm">
									No activities yet.
								</Text>
							) : null}
							{day.activities.map((a) => (
								<Box
									key={a.id}
									style={{
										border: "1px solid var(--mantine-color-gray-3)",
										borderRadius: 10,
										padding: 12,
									}}
								>
									<Group justify="space-between" align="flex-start">
										<Stack gap={2}>
											<Text fw={600}>{a.title}</Text>
											{a.notes ? (
												<Text size="sm" color="dimmed" lineClamp={3}>
													{a.notes}
												</Text>
											) : (
												<Text size="sm" color="dimmed">
													No notes
												</Text>
											)}
										</Stack>
										<ActionIcon
											color="red"
											variant="subtle"
											onClick={() => handleRemove(a.id)}
										>
											<IconTrash size={16} />
										</ActionIcon>
									</Group>
								</Box>
							))}
						</Stack>

						<Group grow gap="xs" align="flex-end" mt="sm">
							<TextInput
								label="Add activity title"
								placeholder="e.g., Senso-ji Temple"
								value={newTitle}
								onChange={(e) => setNewTitle(e.currentTarget.value)}
							/>
							<TextInput
								label="Notes (optional)"
								placeholder="e.g., best time to visit"
								value={newNotes}
								onChange={(e) => setNewNotes(e.currentTarget.value)}
							/>
							<Button onClick={handleAdd} loading={addLoading}>
								<Group gap={6}>
									<IconPlus size={16} />
									Add
								</Group>
							</Button>
						</Group>

						<Stack gap={8}>
							<Textarea
								label="Regenerate day instruction"
								placeholder="e.g., Regenerate Day 3 with more outdoor activities and local markets"
								minRows={3}
								value={instruction}
								onChange={(e) => setInstruction(e.currentTarget.value)}
							/>
							<Button
								onClick={handleRegenerate}
								loading={regenLoading}
								leftSection={<IconSparkles size={16} />}
							>
								{regenLoading ? "Regenerating..." : "Regenerate this day"}
							</Button>
						</Stack>
					</Stack>
				</Accordion.Panel>
			</Accordion.Item>
		</Accordion>
	);
}
