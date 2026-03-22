import type { Companion, DiscoveryId } from "./types";

export const budgetTiers = [
	{ value: "Low" as const, title: "Economy", hint: "Hostels, local eats, public transport" },
	{ value: "Medium" as const, title: "Balanced", hint: "Mid-range stays & dining" },
	{ value: "High" as const, title: "Premium", hint: "Upscale hotels & experiences" },
];

export const companionOptions: readonly Companion[] = ["Solo", "Couple", "Family", "Friends"];

export const quickDays = ["3", "5", "7", "10", "14"];

export const WELCOME_OPTIONS = [
	{ id: "new_trip" as const, label: "Create New Trip" },
	{ id: "inspire" as const, label: "Inspire me where to go" },
	{ id: "hidden_gems" as const, label: "Discover Hidden gems" },
	{ id: "adventure" as const, label: "Adventure Destination" },
] as const;

export const FALLBACK_SUGGESTIONS: Record<
	DiscoveryId,
	readonly { label: string; value: string }[]
> = {
	inspire: [
		{ label: "Portugal — Lisbon, Porto & the coast", value: "Portugal" },
		{ label: "Japan — Kyoto & nearby gems", value: "Japan (Kyoto region)" },
		{ label: "Morocco — cities & desert loop", value: "Morocco" },
	],
	hidden_gems: [
		{ label: "Slovenia — Lake Bled & Ljubljana", value: "Slovenia" },
		{ label: "Georgia — Tbilisi & mountain towns", value: "Georgia" },
		{ label: "Oman — coast, wadis & desert", value: "Oman" },
	],
	adventure: [
		{ label: "New Zealand — South Island", value: "New Zealand South Island" },
		{ label: "Patagonia — Chile & Argentina", value: "Patagonia" },
		{ label: "Nepal — trekking & valleys", value: "Nepal" },
	],
};

export const WELCOME_FALLBACK =
	"Hi! Choose how you would like to plan—or type freely in the box below. I will guide you step by step.";

export const MSG = {
	invalidDays: "Please give a trip length from 1 to 60 days.",
	chooseCompanion:
		"Please choose Solo, Couple, Family, or Friends—tap a card or type one of those.",
	chooseBudget: "Pick Economy, Balanced, or Premium using the cards, or type one of those words.",
	shortDestination: "Please pick a suggestion or type a destination (at least two characters).",
	shortPlaceHidden: "Pick a place from the list or type your own destination.",
	shortPlaceAdventure: "Pick an adventure hub below or type where you want to go.",
	budgetInspire: "Choose Economy, Balanced, or Premium (cards or text).",
	budgetHidden: "Select a budget tier using the cards or type Economy, Balanced, or Premium.",
	budgetAdventure: "Use the budget cards or type Economy, Balanced, or Premium.",
	tripGenError:
		"Something went wrong while generating your trip. Check the message above, adjust if needed, and send your trip length again to retry.",
	assistantUnreachable: "I could not reach the travel assistant. Please try again in a moment.",
} as const;
