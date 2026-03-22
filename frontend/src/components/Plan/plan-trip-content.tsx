"use client";

import {
	Alert,
	Badge,
	Button,
	Card,
	Center,
	Container,
	Group,
	Loader,
	ScrollArea,
	SimpleGrid,
	Stack,
	Text,
	Textarea,
	Title,
} from "@mantine/core";
import { IconCalendarEvent, IconSend, IconSparkles, IconWallet } from "@tabler/icons-react";

import { usePlanTripChat } from "@/features/plan/use-plan-trip-chat";

import { FeatureRow } from "./feature-row";

const pageMinH = "calc(100dvh - 108px)";

export function PlanTripContent() {
	const {
		router,
		inputId,
		viewportRef,
		messages,
		input,
		setInput,
		error,
		chatLoading,
		sendMessage,
		quickOptions,
		inputDisabled,
		canSend,
		busy,
	} = usePlanTripChat();

	return (
		<Container size={1440} py="md" style={{ minHeight: pageMinH }}>
			<SimpleGrid
				cols={{ base: 1, lg: 2 }}
				spacing={{ base: "xl", lg: 48 }}
				verticalSpacing="xl"
				style={{ alignItems: "stretch", minHeight: pageMinH }}
			>
				<Stack gap="xl" justify="flex-start" maw={520} style={{ alignSelf: "start" }}>
					<div>
						<Badge variant="light" color="mainColor" size="lg" radius="md" mb="md">
							AI itinerary
						</Badge>
						<Title order={1} fz={{ base: 28, sm: 34 }} lh={1.2}>
							Plan your trip by chat
						</Title>
						<Text mt="md" size="lg" c="dimmed" lh={1.6}>
							Choose a path or describe what you want. We will collect the details and turn
							them into a full itinerary with budgets in INR and stay ideas.
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
					p={0}
					radius="lg"
					withBorder
					style={{
						borderColor:
							"light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))",
						overflow: "hidden",
						minHeight: pageMinH,
						height: "100%",
						display: "flex",
						flexDirection: "column",
					}}
				>
					<Stack
						gap={0}
						style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
					>
						<Stack
							gap="xs"
							p="lg"
							pb="md"
							style={{
								flexShrink: 0,
								borderBottom: "1px solid var(--mantine-color-default-border)",
							}}
						>
							<Title order={3}>Trip planner</Title>
							<Text size="sm" c="dimmed" lh={1.6}>
								Pick a quick path or type in the box. Cards appear when you need one-tap
								choices—budget, group type, trip length, and suggested destinations.
							</Text>
						</Stack>

						<ScrollArea
							viewportRef={viewportRef}
							flex={1}
							type="auto"
							offsetScrollbars
							style={{ flex: 1, minHeight: 0 }}
							styles={{ viewport: { maxHeight: "100%" } }}
						>
							<Stack gap="md" p="lg" pr="md">
								{messages.length === 0 && chatLoading ? (
									<Center py="xl">
										<Loader size="sm" />
									</Center>
								) : null}
								{messages.map((msg) => (
									<div
										key={msg.id}
										style={{
											display: "flex",
											justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
										}}
									>
										<div
											style={{
												maxWidth: "88%",
												padding: "10px 14px",
												borderRadius: 12,
												background:
													msg.role === "user"
														? "light-dark(var(--mantine-color-mainColor-1), rgba(32, 159, 158, 0.22))"
														: "light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-6))",
												...(msg.role === "user"
													? {
															color:
																"light-dark(var(--mantine-color-white), var(--mantine-color-text))",
														}
													: {}),
											}}
										>
											<Text size="sm" lh={1.55} style={{ whiteSpace: "pre-wrap" }}>
												{msg.content}
											</Text>
										</div>
									</div>
								))}
							</Stack>
						</ScrollArea>

						<Stack
							gap="sm"
							p="lg"
							pt="md"
							style={{
								flexShrink: 0,
								borderTop: "1px solid var(--mantine-color-default-border)",
							}}
						>
							{quickOptions()}

							{error ? (
								<Alert color="red" variant="light">
									{error}
								</Alert>
							) : null}

							<Textarea
								id={inputId}
								placeholder="Type your message here…"
								minRows={2}
								autosize
								maxRows={5}
								disabled={inputDisabled}
								value={input}
								onChange={(e) => setInput(e.currentTarget.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter" && !e.shiftKey) {
										e.preventDefault();
										void sendMessage();
									}
								}}
							/>

							<Group justify="space-between" wrap="wrap" gap="sm">
								<Button
									type="button"
									variant="subtle"
									color="gray"
									onClick={() => router.replace("/dashboard")}
									disabled={busy}
								>
									Back
								</Button>
								<Button
									type="button"
									leftSection={<IconSend size={18} />}
									loading={busy}
									disabled={!canSend}
									size="md"
									variant="gradient"
									gradient={{ from: "teal", to: "cyan", deg: 105 }}
									onClick={() => void sendMessage()}
								>
									Send
								</Button>
							</Group>
						</Stack>
					</Stack>
				</Card>
			</SimpleGrid>
		</Container>
	);
}
