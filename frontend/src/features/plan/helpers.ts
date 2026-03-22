import type { Companion, DiscoveryId, FlowState } from "./types";
import { budgetTiers } from "./constants";

export function discoveryApiPrefix(id: DiscoveryId): "inspire" | "hidden" | "adventure" {
	return id === "hidden_gems" ? "hidden" : id;
}

export function uid() {
	return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function budgetTitle(b: "Low" | "Medium" | "High") {
	return budgetTiers.find((t) => t.value === b)?.title ?? b;
}

export function parseDays(text: string): number | null {
	const trimmed = text.trim().toLowerCase();
	if (/weekend/.test(trimmed)) return 3;
	if (/\bweeks?\b/.test(trimmed)) {
		const n = trimmed.match(/(\d+)/);
		if (n) {
			const w = parseInt(n[1], 10);
			if (w >= 1 && w <= 8) return Math.min(60, w * 7);
		}
		return 7;
	}
	if (/\bmonth\b/.test(trimmed)) return 14;
	const m = trimmed.match(/\b(\d{1,2})\b/);
	if (m) {
		const d = parseInt(m[1], 10);
		if (d >= 1 && d <= 60) return d;
	}
	return null;
}

export function parseBudget(text: string): "Low" | "Medium" | "High" | null {
	const t = text.trim().toLowerCase();
	if (/(economy|budget|low|cheap|backpack)/.test(t)) return "Low";
	if (/(balanced|medium|mid|moderate)/.test(t)) return "Medium";
	if (/(premium|luxury|high|splurge|upscale)/.test(t)) return "High";
	for (const tier of budgetTiers) {
		if (tier.title.toLowerCase() === t) return tier.value;
	}
	return null;
}

export function normalizePlace(text: string): string {
	return text
		.replace(/^(i\s+am\s+leaving\s+from|departing\s+from|from)\s+/i, "")
		.replace(/^(i\s+want\s+to\s+go\s+to|visit|travel\s+to|trip\s+to)\s+/i, "")
		.trim();
}

export function parseCompanion(text: string): Companion | null {
	const t = text.trim().toLowerCase();
	if (/\bsolo\b/.test(t)) return "Solo";
	if (/\bcouple\b/.test(t)) return "Couple";
	if (/\bfamily\b/.test(t)) return "Family";
	if (/\bfriends?\b/.test(t)) return "Friends";
	return null;
}

export function buildInterestsPayload(
	flowKind: Exclude<FlowState["kind"], "welcome" | "generating">,
	departingFrom: string,
	companion: Companion | "",
): string[] {
	const i: string[] = [];
	if (departingFrom) i.push(`Departing from: ${departingFrom}`);
	if (companion) i.push(`Travel group: ${companion}`);
	if (flowKind === "hidden_gems") {
		i.push("Hidden gems", "Off the beaten path");
	}
	if (flowKind === "adventure") i.push("Adventure");
	if (flowKind === "inspire") i.push("Discovery", "Inspiration-led trip");
	return i;
}
