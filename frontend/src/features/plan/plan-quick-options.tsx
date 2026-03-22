import { Button, Group, SimpleGrid, Stack, Text } from "@mantine/core";

import { SelectableTierCard } from "@/components/Plan/selectable-tier-card";

import { budgetTiers, companionOptions, FALLBACK_SUGGESTIONS, quickDays, WELCOME_OPTIONS } from "./constants";
import { budgetTitle } from "./helpers";
import type { Companion, DiscoveryId, FlowState } from "./types";

const companionHints: Record<Companion, string> = {
	Solo: "Just you",
	Couple: "Two travelers",
	Family: "Kids or parents welcome",
	Friends: "Group trip",
};

export type PlanQuickOptionsProps = {
	flow: FlowState;
	loading: boolean;
	chatLoading: boolean;
	busy: boolean;
	budgetType: "Low" | "Medium" | "High" | null;
	companion: Companion | "";
	dynamicSuggestions: { label: string; value: string }[] | null;
	pushUser: (content: string) => void;
	startNewTripFromMenu: () => Promise<void>;
	startDiscovery: (id: DiscoveryId) => Promise<void>;
	applyCompanion: (c: Companion) => Promise<void>;
	applyNewTripBudget: (b: "Low" | "Medium" | "High") => Promise<void>;
	discoveryPickDestination: (id: DiscoveryId, place: string) => Promise<void>;
	discoveryApplyBudget: (id: DiscoveryId, b: "Low" | "Medium" | "High") => Promise<void>;
	onQuickDays: (d: string) => void;
};

type DiscoveryFlow = Extract<FlowState, { kind: DiscoveryId }>;

function isDiscoveryFlow(f: FlowState): f is DiscoveryFlow {
	return f.kind === "inspire" || f.kind === "hidden_gems" || f.kind === "adventure";
}

export function PlanQuickOptions(p: PlanQuickOptionsProps) {
	const {
		flow,
		loading,
		chatLoading,
		busy,
		budgetType,
		companion,
		dynamicSuggestions,
		pushUser,
		startNewTripFromMenu,
		startDiscovery,
		applyCompanion,
		applyNewTripBudget,
		discoveryPickDestination,
		discoveryApplyBudget,
		onQuickDays,
	} = p;

	if (loading && flow.kind !== "generating") return null;
	if (chatLoading && flow.kind !== "welcome" && flow.kind !== "generating") return null;

	if (flow.kind === "welcome") {
		return (
			<SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
				{WELCOME_OPTIONS.map((opt) => (
					<Button
						key={opt.id}
						variant="light"
						radius="md"
						h={70}
						disabled={busy}
						onClick={() => {
							pushUser(opt.label);
							void (async () => {
								if (opt.id === "new_trip") await startNewTripFromMenu();
								else await startDiscovery(opt.id);
							})();
						}}
					>
						{opt.label}
					</Button>
				))}
			</SimpleGrid>
		);
	}

	if (flow.kind === "new_trip") {
		if (flow.step === "companion") {
			return (
				<Stack gap="sm">
					<Text size="sm" fw={500}>
						Who are you traveling with?
					</Text>
					<SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
						{companionOptions.map((c) => (
							<SelectableTierCard
								key={c}
								selected={companion === c}
								title={c}
								hint={companionHints[c]}
								disabled={busy}
								onClick={() => {
									void (async () => {
										pushUser(c);
										await applyCompanion(c);
									})();
								}}
							/>
						))}
					</SimpleGrid>
				</Stack>
			);
		}
		if (flow.step === "budget") {
			return (
				<Stack gap="sm">
					<Text size="sm" fw={500}>
						Budget style
					</Text>
					<SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
						{budgetTiers.map((tier) => (
							<SelectableTierCard
								key={tier.value}
								selected={budgetType === tier.value}
								title={tier.title}
								hint={tier.hint}
								disabled={busy}
								onClick={() => {
									void (async () => {
										pushUser(tier.title);
										await applyNewTripBudget(tier.value);
									})();
								}}
							/>
						))}
					</SimpleGrid>
				</Stack>
			);
		}
		if (flow.step === "days") {
			return (
				<Group grow justify="space-between">
					{quickDays.map((d) => (
						<Button
							key={d}
							size="xs"
							variant="light"
							radius="md"
							h={70}
							disabled={busy}
							onClick={() => onQuickDays(d)}
						>
							{d} days
						</Button>
					))}
				</Group>
			);
		}
		return null;
	}

	if (isDiscoveryFlow(flow)) {
		const id = flow.kind;
		if (flow.step === "destination") {
			const items = dynamicSuggestions ?? [...FALLBACK_SUGGESTIONS[id]];
			return (
				<Stack gap="sm">
					{items.map((item) => (
						<Button
							key={`${item.label}-${item.value}`}
							variant="light"
							radius="md"
							h={70}
							disabled={busy}
							onClick={() => {
								pushUser(item.label);
								void discoveryPickDestination(id, item.value);
							}}
						>
							{item.label}
						</Button>
					))}
				</Stack>
			);
		}
		if (flow.step === "budget") {
			return (
				<Stack gap="sm">
					<Text size="sm" fw={500}>
						Budget style
					</Text>
					<SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
						{budgetTiers.map((tier) => (
							<SelectableTierCard
								key={tier.value}
								selected={budgetType === tier.value}
								title={tier.title}
								hint={tier.hint}
								disabled={busy}
								onClick={() => {
									void (async () => {
										pushUser(budgetTitle(tier.value));
										await discoveryApplyBudget(id, tier.value);
									})();
								}}
							/>
						))}
					</SimpleGrid>
				</Stack>
			);
		}
		if (flow.step === "days") {
			return (
				<Group grow justify="space-between">
					{quickDays.map((d) => (
						<Button
							key={d}
							size="xs"
							variant="light"
							radius="md"
							h={70}
							disabled={busy}
							onClick={() => onQuickDays(d)}
						>
							{d} days
						</Button>
					))}
				</Group>
			);
		}
	}

	return null;
}
