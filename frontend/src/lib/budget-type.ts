import type { Trip } from "@/lib/trips";

export type TripBudgetType = Trip["budgetType"];

/** Mantine Badge `color` for trip budget tier (Low / Medium / High). */
export function budgetTypeBadgeColor(type: TripBudgetType): "blue" | "orange" | "red" {
	if (type === "High") return "red";
	if (type === "Medium") return "orange";
	return "blue";
}
