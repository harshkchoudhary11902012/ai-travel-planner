export type FlowState =
	| { kind: "welcome" }
	| { kind: "new_trip"; step: "departure" | "destination" | "companion" | "budget" | "days" }
	| { kind: "inspire"; step: "prompt" | "destination" | "budget" | "days" }
	| { kind: "hidden_gems"; step: "prompt" | "destination" | "budget" | "days" }
	| { kind: "adventure"; step: "prompt" | "destination" | "budget" | "days" }
	| { kind: "generating" };

export type ChatMessage = { id: string; role: "user" | "assistant"; content: string };

export type Companion = "Solo" | "Couple" | "Family" | "Friends";

export type DiscoveryId = "inspire" | "hidden_gems" | "adventure";
