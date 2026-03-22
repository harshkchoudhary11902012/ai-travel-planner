import { api } from "./api";

export type PlanChatResponse = {
	message: string;
	suggestions: { label: string; value: string }[] | null;
};

export async function planChat(body: {
	phase: string;
	context?: Record<string, string>;
	userMessage?: string;
}) {
	return api<PlanChatResponse>("/api/plan/chat", {
		method: "POST",
		body: JSON.stringify(body),
	});
}
