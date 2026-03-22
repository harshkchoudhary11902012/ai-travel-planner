"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api";
import { planChat } from "@/lib/plan-chat";
import type { Trip } from "@/lib/trips";

import { FALLBACK_SUGGESTIONS, MSG, WELCOME_FALLBACK } from "./constants";
import {
	budgetTitle,
	buildInterestsPayload,
	discoveryApiPrefix,
	normalizePlace,
	parseBudget,
	parseCompanion,
	parseDays,
	uid,
} from "./helpers";
import { PlanQuickOptions } from "./plan-quick-options";
import type { ChatMessage, Companion, DiscoveryId, FlowState } from "./types";

function isDiscoveryKind(k: FlowState["kind"]): k is DiscoveryId {
	return k === "inspire" || k === "hidden_gems" || k === "adventure";
}

export function usePlanTripChat() {
	const router = useRouter();
	const inputId = useId();
	const viewportRef = useRef<HTMLDivElement>(null);

	const [flow, setFlow] = useState<FlowState>({ kind: "welcome" });
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [input, setInput] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [chatLoading, setChatLoading] = useState(false);
	const [dynamicSuggestions, setDynamicSuggestions] = useState<
		{ label: string; value: string }[] | null
	>(null);

	const [departingFrom, setDepartingFrom] = useState("");
	const [destination, setDestination] = useState("");
	const [companion, setCompanion] = useState<Companion | "">("");
	const [budgetType, setBudgetType] = useState<"Low" | "Medium" | "High" | null>(null);
	const [days, setDays] = useState<number | null>(null);

	const restoreFlowRef = useRef<FlowState>({ kind: "welcome" });

	const scrollToBottom = useCallback(() => {
		requestAnimationFrame(() => {
			viewportRef.current?.scrollTo({
				top: viewportRef.current.scrollHeight,
				behavior: "smooth",
			});
		});
	}, []);

	useEffect(() => {
		scrollToBottom();
	}, [messages, scrollToBottom]);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			setChatLoading(true);
			try {
				const res = await planChat({ phase: "welcome_intro" });
				if (!cancelled) setMessages([{ id: uid(), role: "assistant", content: res.message }]);
			} catch {
				if (!cancelled) setMessages([{ id: uid(), role: "assistant", content: WELCOME_FALLBACK }]);
			} finally {
				if (!cancelled) setChatLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	const pushUser = (content: string) => {
		setMessages((m) => [...m, { id: uid(), role: "user", content }]);
	};

	const pushAssistant = (content: string) => {
		setMessages((m) => [...m, { id: uid(), role: "assistant", content }]);
	};

	const assistantPhase = async (
		phase: string,
		options?: {
			context?: Record<string, string>;
			userMessage?: string;
			applySuggestions?: boolean;
			fallbackMessage?: string;
			fallbackSuggestions?: { label: string; value: string }[];
		},
	) => {
		setChatLoading(true);
		setError(null);
		try {
			const res = await planChat({
				phase,
				context: options?.context,
				userMessage: options?.userMessage,
			});
			pushAssistant(res.message);
			setDynamicSuggestions(
				options?.applySuggestions ? (res.suggestions ?? options.fallbackSuggestions ?? null) : null,
			);
			return res;
		} catch {
			pushAssistant(options?.fallbackMessage ?? MSG.assistantUnreachable);
			setDynamicSuggestions(
				options?.applySuggestions ? (options.fallbackSuggestions ?? null) : null,
			);
			return null;
		} finally {
			setChatLoading(false);
		}
	};

	const runGeneration = useCallback(
		async (explicitDays?: number) => {
			const dayCount = explicitDays ?? days;
			if (!destination || dayCount === null || !budgetType) return;
			if (flow.kind === "welcome" || flow.kind === "generating") return;

			const flowForPayload = flow;
			restoreFlowRef.current = flowForPayload;

			const interests = buildInterestsPayload(flowForPayload.kind, departingFrom, companion);

			setFlow({ kind: "generating" });
			setLoading(true);
			setError(null);
			setDynamicSuggestions(null);
			try {
				const ack = await planChat({
					phase: "trip_generation_start",
					context: {
						destination,
						days: String(dayCount),
						budgetType: budgetType ?? "",
						flowKind: flowForPayload.kind,
						departingFrom,
						companion: companion || "",
						interestsSummary: interests.join("; "),
					},
				});
				pushAssistant(ack.message);
			} catch {
				pushAssistant(`Creating your ${dayCount}-day plan for ${destination}. This may take a moment…`);
			}
			try {
				const trip = await api<Trip>("/api/trips", {
					method: "POST",
					body: JSON.stringify({
						destination,
						days: dayCount,
						budgetType,
						interests,
					}),
				});
				router.replace(`/trips/${trip._id}`);
			} catch (e) {
				setError(e instanceof Error ? e.message : "Trip generation failed");
				setFlow(restoreFlowRef.current);
				pushAssistant(MSG.tripGenError);
			} finally {
				setLoading(false);
			}
		},
		[destination, days, budgetType, departingFrom, companion, flow, router],
	);

	const resetPlanningState = () => {
		setDepartingFrom("");
		setDestination("");
		setCompanion("");
		setBudgetType(null);
		setDays(null);
		setDynamicSuggestions(null);
	};

	const startNewTripFromMenu = async () => {
		resetPlanningState();
		setFlow({ kind: "new_trip", step: "departure" });
		await assistantPhase("new_trip_departure_intro");
	};

	const startDiscovery = async (id: DiscoveryId) => {
		resetPlanningState();
		setFlow({ kind: id, step: "prompt" });
		await assistantPhase(`${discoveryApiPrefix(id)}_prompt_intro`);
	};

	const handleWelcomeText = async (text: string) => {
		const low = text.toLowerCase();
		if (/(inspire|idea|where\s+to\s+go|suggest)/.test(low)) {
			await startDiscovery("inspire");
			return;
		}
		if (/(hidden|secret|off\s*the\s*beaten|gem)/.test(low)) {
			await startDiscovery("hidden_gems");
			return;
		}
		if (/(adventure|trek|hike|dive|extreme)/.test(low)) {
			await startDiscovery("adventure");
			return;
		}
		resetPlanningState();
		setFlow({ kind: "new_trip", step: "departure" });
		await handleNewTripDeparture(text);
	};

	const handleNewTripDeparture = async (raw: string) => {
		const place = normalizePlace(raw);
		if (place.length < 2) {
			await assistantPhase("new_trip_invalid_departure", {
				userMessage: raw,
				fallbackMessage: "Please share where you are leaving from (at least two characters).",
			});
			return;
		}
		setDepartingFrom(place);
		setFlow({ kind: "new_trip", step: "destination" });
		await assistantPhase("new_trip_after_departure", { context: { departingFrom: place } });
	};

	const handleNewTripDestination = async (raw: string) => {
		const place = normalizePlace(raw);
		if (place.length < 2) {
			await assistantPhase("new_trip_invalid_destination", {
				userMessage: raw,
				fallbackMessage: "Please share a destination with at least two characters.",
			});
			return;
		}
		setDestination(place);
		setFlow({ kind: "new_trip", step: "companion" });
		await assistantPhase("new_trip_after_destination", {
			context: { departingFrom, destination: place },
		});
	};

	const applyCompanion = async (c: Companion) => {
		setCompanion(c);
		setFlow({ kind: "new_trip", step: "budget" });
		await assistantPhase("new_trip_after_companion", {
			context: { departingFrom, destination, companion: c },
		});
	};

	const applyNewTripBudget = async (b: "Low" | "Medium" | "High") => {
		setBudgetType(b);
		const label = budgetTitle(b);
		setFlow({ kind: "new_trip", step: "days" });
		await assistantPhase("new_trip_after_budget", {
			context: {
				departingFrom,
				destination,
				companion: companion || "",
				budgetTitle: label,
			},
		});
	};

	const handleNewTripDays = async (raw: string) => {
		const d = parseDays(raw);
		if (d === null) {
			await assistantPhase("new_trip_invalid_days", {
				userMessage: raw,
				fallbackMessage:
					"I need a trip length between 1 and 60 days—try a number like 7 or say two weeks.",
			});
			return;
		}
		setDays(d);
		void runGeneration(d);
	};

	const discoveryAfterPrompt = async (id: DiscoveryId, raw: string) => {
		const p = discoveryApiPrefix(id);
		const invalidPhase = `${p}_invalid_prompt` as const;
		const fallbacks: Record<DiscoveryId, string> = {
			inspire:
				"Add a bit more detail so I can suggest places that fit you—climate, vibe, or region.",
			hidden_gems: "Tell me a region, country, or the vibe you want for hidden gems.",
			adventure: "Add a little more—adventure style, region, or activity helps.",
		};
		if (raw.trim().length < 2) {
			await assistantPhase(invalidPhase, {
				userMessage: raw,
				fallbackMessage: fallbacks[id],
			});
			return;
		}
		await assistantPhase(`${p}_after_user_prompt`, {
			userMessage: raw,
			applySuggestions: true,
			fallbackSuggestions: [...FALLBACK_SUGGESTIONS[id]],
		});
		setFlow({ kind: id, step: "destination" });
	};

	const discoveryPickDestination = async (id: DiscoveryId, place: string) => {
		const p = discoveryApiPrefix(id);
		setDestination(place);
		setFlow({ kind: id, step: "budget" });
		await assistantPhase(`${p}_after_destination`, { context: { destination: place } });
	};

	const discoveryApplyBudget = async (id: DiscoveryId, b: "Low" | "Medium" | "High") => {
		const p = discoveryApiPrefix(id);
		setBudgetType(b);
		const label = budgetTitle(b);
		setFlow({ kind: id, step: "days" });
		await assistantPhase(`${p}_after_budget`, {
			context: { destination, budgetTitle: label },
		});
	};

	const discoveryHandleDays = (raw: string) => {
		const d = parseDays(raw);
		if (d === null) {
			pushAssistant(MSG.invalidDays);
			return;
		}
		setDays(d);
		void runGeneration(d);
	};

	const sendMessage = async () => {
		const text = input.trim();
		if (!text || loading || chatLoading) return;
		setInput("");
		pushUser(text);

		if (flow.kind === "welcome") {
			await handleWelcomeText(text);
			return;
		}
		if (flow.kind === "generating") return;

		if (flow.kind === "new_trip") {
			if (flow.step === "departure") await handleNewTripDeparture(text);
			else if (flow.step === "destination") await handleNewTripDestination(text);
			else if (flow.step === "companion") {
				const c = parseCompanion(text);
				if (c) await applyCompanion(c);
				else pushAssistant(MSG.chooseCompanion);
			} else if (flow.step === "budget") {
				const b = parseBudget(text);
				if (b) await applyNewTripBudget(b);
				else pushAssistant(MSG.chooseBudget);
			} else if (flow.step === "days") await handleNewTripDays(text);
			return;
		}

		if (isDiscoveryKind(flow.kind)) {
			const id = flow.kind;
			if (flow.step === "prompt") await discoveryAfterPrompt(id, text);
			else if (flow.step === "destination") {
				const place = normalizePlace(text);
				if (place.length < 2) {
					pushAssistant(
						id === "inspire"
							? MSG.shortDestination
							: id === "hidden_gems"
								? MSG.shortPlaceHidden
								: MSG.shortPlaceAdventure,
					);
					return;
				}
				await discoveryPickDestination(id, place);
			} else if (flow.step === "budget") {
				const b = parseBudget(text);
				if (b) await discoveryApplyBudget(id, b);
				else
					pushAssistant(
						id === "inspire"
							? MSG.budgetInspire
							: id === "hidden_gems"
								? MSG.budgetHidden
								: MSG.budgetAdventure,
					);
			} else if (flow.step === "days") discoveryHandleDays(text);
		}
	};

	const onQuickDays = (d: string) => {
		if (loading || chatLoading) return;
		const n = parseInt(d, 10);
		pushUser(`${d} days`);
		setDays(n);
		void runGeneration(n);
	};

	const busy = loading || chatLoading;
	const inputDisabled = busy || flow.kind === "generating";
	const canSend = !busy && flow.kind !== "generating" && input.trim().length > 0;

	const quickOptions = () => (
		<PlanQuickOptions
			flow={flow}
			loading={loading}
			chatLoading={chatLoading}
			busy={busy}
			budgetType={budgetType}
			companion={companion}
			dynamicSuggestions={dynamicSuggestions}
			pushUser={pushUser}
			startNewTripFromMenu={startNewTripFromMenu}
			startDiscovery={startDiscovery}
			applyCompanion={applyCompanion}
			applyNewTripBudget={applyNewTripBudget}
			discoveryPickDestination={discoveryPickDestination}
			discoveryApplyBudget={discoveryApplyBudget}
			onQuickDays={onQuickDays}
		/>
	);

	return {
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
	};
}
