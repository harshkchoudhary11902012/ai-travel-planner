import OpenAI, { APIError } from "openai";
import { z } from "zod";

import type { TripBudgetType } from "../models/Trip";

function resolveBaseURL(): string {
	const raw = (
		process.env.LLM_BASE_URL ||
		process.env.OPENAI_BASE_URL ||
		"https://g4f.space/v1"
	).trim();
	const normalized = raw.replace(/\/+$/, "");
	if (normalized.endsWith("/openai")) return normalized;
	return normalized.endsWith("/v1") ? normalized : `${normalized}/v1`;
}

const apiKey = (process.env.OPENAI_API_KEY || process.env.LLM_API_KEY || "").trim();
const baseURL = resolveBaseURL();
const isGeminiPrimary = baseURL.includes("generativelanguage.googleapis.com");

if (!apiKey) {
	console.error(
		isGeminiPrimary
			? "[LLM] Missing OPENAI_API_KEY: use your Google AI Studio key (https://aistudio.google.com/app/apikey)."
			: "[LLM] Missing OPENAI_API_KEY (or LLM_API_KEY). For G4F: g4f.dev/api_key — or add GEMINI_API_KEY for auto-fallback when G4F returns 404.",
	);
}

const openai = new OpenAI({
	apiKey: apiKey || "missing-api-key",
	baseURL,
});

const primaryModel = (
	process.env.OPENAI_MODEL || (isGeminiPrimary ? "gemini-2.5-flash" : "gpt-4o-mini")
).trim();

/** 429 responses per model before moving to the next model (default 2). */
const max429AttemptsPerModel = Math.min(
	5,
	Math.max(1, Number.parseInt(process.env.LLM_429_ATTEMPTS_PER_MODEL || "2", 10) || 2),
);

let lastSuccessfulModel: string | null = null;

function fallbackModelList(): string[] {
	// OpenAI-compat endpoint: 1.5 IDs often 404; use 2.5 / 3.x from https://ai.google.dev/gemini-api/docs/openai
	const defaultFallbacks = isGeminiPrimary
		? "gemini-2.0-flash,gemini-2.5-flash-lite,gemini-3-flash-preview"
		: "gpt-4o-mini,gpt-4-turbo";
	const fromEnv = (process.env.LLM_MODEL_FALLBACKS || defaultFallbacks)
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);
	const seen = new Set<string>();
	const ordered: string[] = [];
	for (const m of [primaryModel, ...fromEnv]) {
		if (!seen.has(m)) {
			seen.add(m);
			ordered.push(m);
		}
	}
	return ordered;
}

/** Prefer the last model that completed a request so we do not reset to a rate-limited primary every call. */
function prioritizeLastSuccess(candidates: string[]): string[] {
	if (!lastSuccessfulModel || !candidates.includes(lastSuccessfulModel)) return candidates;
	return [lastSuccessfulModel, ...candidates.filter((m) => m !== lastSuccessfulModel)];
}

type TryCreateResult =
	| { ok: true; completion: OpenAI.Chat.ChatCompletion }
	| { ok: false; lastError: unknown; exhausted404: boolean };

async function sleep(ms: number) {
	await new Promise((r) => setTimeout(r, ms));
}

async function createChatWith429Retries(
	client: OpenAI,
	model: string,
	messages: OpenAI.Chat.ChatCompletionMessageParam[],
	temperature: number,
	logLabel: string,
): Promise<OpenAI.Chat.ChatCompletion> {
	let lastErr: unknown;

	for (let attempt = 0; attempt < max429AttemptsPerModel; attempt++) {
		try {
			return await client.chat.completions.create({
				model,
				messages,
				temperature,
			});
		} catch (err) {
			lastErr = err;
			const is429 = err instanceof APIError && err.status === 429;
			if (!is429) throw err;
			if (attempt >= max429AttemptsPerModel - 1) throw err;

			const header =
				err instanceof APIError && err.headers ? err.headers.get("retry-after") : null;
			const retryAfterSec = header ? Number.parseFloat(header) : Number.NaN;
			const waitMs =
				Number.isFinite(retryAfterSec) && retryAfterSec >= 0
					? Math.min(5000, Math.max(300, retryAfterSec * 1000))
					: Math.min(2000, 800 * (attempt + 1));

			console.warn(
				`${logLabel} Model "${model}" rate limited (429). Waiting ${Math.round(waitMs / 1000)}s (same-model attempt ${attempt + 1}/${max429AttemptsPerModel})…`,
			);
			await sleep(waitMs);
		}
	}

	throw lastErr;
}

async function tryCreateWithClient(
	client: OpenAI,
	models: string[],
	messages: OpenAI.Chat.ChatCompletionMessageParam[],
	temperature: number,
	logLabel: string,
): Promise<TryCreateResult> {
	let lastErr: unknown;

	for (let i = 0; i < models.length; i++) {
		const m = models[i]!;
		try {
			const completion = await createChatWith429Retries(
				client,
				m,
				messages,
				temperature,
				logLabel,
			);
			lastSuccessfulModel = m;
			if (i > 0) {
				console.warn(`${logLabel} Succeeded with model "${m}".`);
			}
			return { ok: true, completion };
		} catch (err) {
			lastErr = err;
			const is404 = err instanceof APIError && err.status === 404;
			const is429 = err instanceof APIError && err.status === 429;

			if (is404 && i < models.length - 1) {
				console.warn(`${logLabel} Model "${m}" unavailable (404). Trying next…`);
				continue;
			}
			if (is404 && i === models.length - 1) {
				return { ok: false, lastError: err, exhausted404: true };
			}

			if (is429 && i < models.length - 1) {
				console.warn(
					`${logLabel} Model "${m}" rate limited after retries. Trying next model…`,
				);
				continue;
			}

			if (err instanceof APIError) {
				console.error(`${logLabel} APIError:`, err.status, err.message);
			}
			return { ok: false, lastError: err, exhausted404: false };
		}
	}

	return { ok: false, lastError: lastErr, exhausted404: false };
}

async function chatCompletionCreate(
	messages: OpenAI.Chat.ChatCompletionMessageParam[],
	temperature: number,
): Promise<OpenAI.Chat.ChatCompletion> {
	const primary = await tryCreateWithClient(
		openai,
		prioritizeLastSuccess(fallbackModelList()),
		messages,
		temperature,
		"[LLM]",
	);
	if (primary.ok) return primary.completion;

	const geminiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "").trim();

	const shouldTryGemini =
		geminiKey &&
		!isGeminiPrimary &&
		primary.exhausted404 &&
		primary.lastError instanceof APIError &&
		primary.lastError.status === 404;

	if (shouldTryGemini) {
		console.warn(
			"[LLM] Primary host returned 404 for every model (common with g4f.space/v1). Retrying with Google Gemini…",
		);
		const gemClient = new OpenAI({
			apiKey: geminiKey,
			baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
		});
		const gemPrimary = (process.env.GEMINI_MODEL || "gemini-2.5-flash").trim();
		const gemExtras = (
			process.env.GEMINI_MODEL_FALLBACKS ||
			"gemini-2.0-flash,gemini-2.5-flash-lite,gemini-3-flash-preview"
		)
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean);
		const gemModels = prioritizeLastSuccess([gemPrimary, ...gemExtras.filter((x) => x !== gemPrimary)]);

		const secondary = await tryCreateWithClient(
			gemClient,
			gemModels,
			messages,
			temperature,
			"[LLM][Gemini]",
		);
		if (secondary.ok) return secondary.completion;
		throw secondary.lastError;
	}

	throw primary.lastError;
}

export const ActivitySchema = z.object({
	id: z.string().min(1),
	title: z.string().min(1),
	notes: z.string().optional().default(""),
});

export const DaySchema = z.object({
	dayNumber: z.number().int().min(1),
	activities: z.array(ActivitySchema).min(1).max(6),
});

export const BudgetSchema = z.object({
	flights: z.number().nonnegative(),
	accommodation: z.number().nonnegative(),
	food: z.number().nonnegative(),
	activities: z.number().nonnegative(),
	total: z.number().nonnegative(),
});

export const HotelSchema = z.object({
	name: z.string().min(1),
	neighborhood: z.string().optional().default(""),
	rating: z.number().min(0).max(5).optional(),
	priceTier: z.string().optional().default(""),
	website: z.string().optional().default(""),
});

export const TripGenerationSchema = z.object({
	itinerary: z.array(DaySchema).min(1),
	budget: BudgetSchema,
	hotels: z.array(HotelSchema).min(3).max(5),
});

export const RegenerateDaySchema = z.object({
	dayNumber: z.number().int().min(1),
	activities: z.array(ActivitySchema).min(1).max(8),
});

function extractJson(text: string): string {
	const trimmed = text.trim();
	if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;
	if (trimmed.startsWith("[") && trimmed.endsWith("]")) return trimmed;

	const firstBrace = trimmed.indexOf("{");
	const lastBrace = trimmed.lastIndexOf("}");
	if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
		return trimmed.slice(firstBrace, lastBrace + 1);
	}

	const firstBracket = trimmed.indexOf("[");
	const lastBracket = trimmed.lastIndexOf("]");
	if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
		return trimmed.slice(firstBracket, lastBracket + 1);
	}

	return trimmed;
}

async function callWithRetry<T>({
	schema,
	systemPrompt,
	userPrompt,
	retries,
}: {
	schema: z.ZodType<T>;
	systemPrompt: string;
	userPrompt: string;
	retries: number;
}): Promise<T> {
	let lastError: unknown;
	let currentUserPrompt = userPrompt;

	for (let attempt = 0; attempt <= retries; attempt++) {
		let content: string;
		try {
			const completion = await chatCompletionCreate(
				[
					{ role: "system", content: systemPrompt },
					{ role: "user", content: currentUserPrompt },
				],
				0.3,
			);
			content = completion.choices[0]?.message?.content || "";
		} catch (err) {
			throw err;
		}

		try {
			const json = JSON.parse(extractJson(content)) as unknown;
			const parsed = schema.parse(json);
			return parsed;
		} catch (err) {
			lastError = err;
			if (attempt === 0) {
				console.error(
					"[LLM] JSON parse/schema failed. Output (truncated):",
					content.slice(0, 500),
				);
			}
		}

		if (attempt < retries) {
			const correctionPrompt = `Your previous output did not match the expected schema.\n\nPlease return ONLY valid JSON matching the schema keys exactly.\n\nNote: Do not include markdown, code fences, or trailing commentary.`;

			currentUserPrompt = `${currentUserPrompt}\n\n${correctionPrompt}`;
		}
	}

	throw lastError;
}

export async function generateTrip(input: {
	destination: string;
	days: number;
	budgetType: TripBudgetType;
	interests: string[];
}) {
	const promptInterests = input.interests.length
		? input.interests.join(", ")
		: "general sightseeing";

	const budgetTypeHint =
		input.budgetType === "Low" ? "Budget" : input.budgetType === "Medium" ? "Mid" : "Luxury";

	const systemPrompt = [
		"You are a senior travel planner and a strict JSON generator.",
		"Return valid JSON only (no markdown, no code fences).",
		"All numeric budget values are in INR (Indian Rupees). Use realistic India-market trip estimates.",
	].join(" ");

	const userPrompt = [
		`Destination: ${input.destination}`,
		`Trip length (days): ${input.days}`,
		`Budget preference: ${input.budgetType} (${budgetTypeHint} hotel tier)`,
		`Interests: ${promptInterests}`,
		"",
		"Return a JSON object with exactly these keys: itinerary, budget, hotels.",
		"itinerary: an array of day objects. Each day has: dayNumber (1..days), activities (2..4 recommended).",
		"Each activity must have: id (string), title (string), notes (string).",
		"budget: flights, accommodation, food, activities, total (total must be flights+accommodation+food+activities).",
		"hotels: 3 to 5 hotels. Each hotel must include: name, neighborhood, rating (0..5 if known), priceTier, website (can be empty string).",
	].join("\n");

	const parsed = await callWithRetry({
		schema: TripGenerationSchema,
		systemPrompt,
		userPrompt,
		retries: 2,
	});

	const computedTotal =
		parsed.budget.flights +
		parsed.budget.accommodation +
		parsed.budget.food +
		parsed.budget.activities;

	return {
		...parsed,
		budget: {
			...parsed.budget,
			total: computedTotal,
		},
	};
}

export async function regenerateDay(input: {
	destination: string;
	days: number;
	budgetType: TripBudgetType;
	interests: string[];
	dayNumber: number;
	instruction: string;
	existingActivities: Array<{ id: string; title: string; notes?: string }>;
}) {
	const systemPrompt = [
		"You are a senior travel planner and a strict JSON generator.",
		"Return valid JSON only (no markdown, no code fences).",
	].join(" ");

	const existing = input.existingActivities.map((a) => `- ${a.title} (id=${a.id})`).join("\n");

	const promptInterests = input.interests.length
		? input.interests.join(", ")
		: "general sightseeing";

	const userPrompt = [
		`Destination: ${input.destination}`,
		`Budget preference: ${input.budgetType}`,
		`Interests: ${promptInterests}`,
		`Regenerate day ${input.dayNumber} with this instruction: ${input.instruction}`,
		"",
		"Existing activities for this day:",
		existing || "- (none provided)",
		"",
		"Return ONLY a JSON object with keys: dayNumber, activities.",
		"dayNumber must equal the requested day number.",
		"activities: 2..4 recommended. Each activity needs: id (string), title (string), notes (string).",
	].join("\n");

	return await callWithRetry({
		schema: RegenerateDaySchema,
		systemPrompt,
		userPrompt,
		retries: 2,
	});
}

const PlanChatResponseSchema = z.object({
	message: z.string().min(1),
	suggestions: z.union([
		z.null(),
		z
			.array(
				z.object({
					label: z.string().min(1),
					value: z.string().min(1),
				}),
			)
			.length(3),
	]),
});

export const PLAN_CHAT_PHASES = [
	"welcome_intro",
	"new_trip_departure_intro",
	"new_trip_after_departure",
	"new_trip_after_destination",
	"new_trip_after_companion",
	"new_trip_after_budget",
	"new_trip_invalid_departure",
	"new_trip_invalid_destination",
	"new_trip_invalid_days",
	"inspire_prompt_intro",
	"inspire_after_user_prompt",
	"inspire_after_destination",
	"inspire_after_budget",
	"inspire_invalid_prompt",
	"hidden_prompt_intro",
	"hidden_after_user_prompt",
	"hidden_after_destination",
	"hidden_after_budget",
	"hidden_invalid_prompt",
	"adventure_prompt_intro",
	"adventure_after_user_prompt",
	"adventure_after_destination",
	"adventure_after_budget",
	"adventure_invalid_prompt",
	"trip_generation_start",
] as const;

export type PlanChatPhase = (typeof PLAN_CHAT_PHASES)[number];

const PHASES_NEED_SUGGESTIONS = new Set<PlanChatPhase>([
	"inspire_after_user_prompt",
	"hidden_after_user_prompt",
	"adventure_after_user_prompt",
]);

const PHASE_INSTRUCTIONS: Record<PlanChatPhase, string> = {
	welcome_intro:
		"Greet the user in 2–3 short sentences. Invite them to use the four options below or type freely. Warm, practical, no markdown.",
	new_trip_departure_intro:
		"They chose Create New Trip. Ask where they are departing from (city, region, or airport). One short paragraph.",
	new_trip_after_departure:
		"Acknowledge their departure point from context. Ask where they want to go next (destination city or country).",
	new_trip_after_destination:
		"They gave a destination. Ask who they are traveling with: Solo, Couple, Family, or Friends—mention they can tap cards or type.",
	new_trip_after_companion:
		"Acknowledge their travel group from context. Ask them to choose a budget style: Economy, Balanced, or Premium (cards or words).",
	new_trip_after_budget:
		"Acknowledge their budget tier from context. Ask how many days the trip should be (1–60), mention quick picks or typing.",
	new_trip_invalid_departure:
		"Their departure answer was too vague or missing. Politely ask again for a real departure place (at least two characters).",
	new_trip_invalid_destination:
		"Their destination was unclear. Ask again for a city, region, or country.",
	new_trip_invalid_days:
		"They did not give a valid trip length. Ask for a number of days between 1 and 60 (examples: 5, two weeks).",
	inspire_prompt_intro:
		"They want inspiration. Ask what they are craving—climate, vibe, max travel time, or a region they are curious about.",
	inspire_after_user_prompt:
		"Based on their message, propose exactly three diverse destination ideas as next-step options. In message: briefly reflect their input and tease the three ideas. suggestions must have 3 items: label is a catchy short line; value is a concrete region/country/city string suitable for an itinerary title.",
	inspire_after_destination:
		"Acknowledge their chosen destination from context. Ask what budget style to plan for (Economy, Balanced, Premium).",
	inspire_after_budget:
		"Acknowledge budget from context. Ask how many days they have for the trip.",
	inspire_invalid_prompt:
		"Their reply was too short. Ask for a bit more—climate, vibe, budget, or region—to suggest places.",
	hidden_prompt_intro:
		"They want hidden gems. Ask which region or country to explore, or the atmosphere they want (quiet villages, nature, food).",
	hidden_after_user_prompt:
		"From their message, propose exactly three lesser-known or quieter destinations. Message: reflect their vibe briefly. suggestions: 3 items with label + value (specific place/region for planning).",
	hidden_after_destination:
		"Acknowledge destination from context. Ask for budget style for stays and meals.",
	hidden_after_budget:
		"Acknowledge budget. Ask how many days they will be away.",
	hidden_invalid_prompt:
		"Ask again for a region, country, or the kind of hidden-gem experience they want.",
	adventure_prompt_intro:
		"They want adventure. Ask what fits—trekking, diving, road trip, wildlife—or a region in mind.",
	adventure_after_user_prompt:
		"From their message, propose exactly three strong adventure destinations. Message: brief encouragement. suggestions: 3 items label + value (region/country suitable for an adventure itinerary).",
	adventure_after_destination:
		"Acknowledge destination from context. Ask their budget tier for this adventure.",
	adventure_after_budget:
		"Acknowledge budget. Ask how many days they can spend.",
	adventure_invalid_prompt:
		"Ask for more detail on adventure style, activity, or region.",
	trip_generation_start:
		"They are about to generate a full itinerary. Give one or two short sentences of encouragement that you are building their plan. Use destination, days, budgetType, flowKind, and interestsSummary from context when helpful. suggestions must be null.",
};

function buildPlanChatUserPrompt(input: {
	phase: PlanChatPhase;
	userMessage?: string;
	context?: Record<string, string>;
}): string {
	const instr = PHASE_INSTRUCTIONS[input.phase];
	const lines = [
		`Phase: ${input.phase}`,
		`What to write: ${instr}`,
		`Context JSON: ${JSON.stringify(input.context ?? {})}`,
	];
	if (input.userMessage !== undefined && input.userMessage !== "") {
		lines.push(`Latest user message: ${input.userMessage}`);
	}
	lines.push(
		'Return ONLY JSON: {"message":"...","suggestions":null} OR if this phase requires three destination picks, {"message":"...","suggestions":[{"label":"...","value":"..."},...3 items]}. No markdown, no code fences.',
	);
	return lines.join("\n\n");
}

export async function planAssistantResponse(input: {
	phase: PlanChatPhase;
	userMessage?: string;
	context?: Record<string, string>;
}): Promise<{ message: string; suggestions: Array<{ label: string; value: string }> | null }> {
	if (!PHASE_INSTRUCTIONS[input.phase]) {
		throw new Error(`Unknown phase: ${input.phase}`);
	}

	const wantsSuggestions = PHASES_NEED_SUGGESTIONS.has(input.phase);
	const systemPrompt = [
		"You are a warm, concise travel planning assistant for an app that builds day-by-day itineraries (budgets in Indian Rupees).",
		"Always return valid JSON only (no markdown, no code fences).",
		'The JSON must have keys "message" (plain text, no markdown) and "suggestions".',
		'Set "suggestions" to null unless the phase requires exactly three {label, value} destination options.',
		"Labels are shown as buttons; values are passed to the itinerary generator as the destination string.",
	].join(" ");

	const userPrompt = buildPlanChatUserPrompt(input);

	let lastError: unknown;
	let correction = "";

	for (let attempt = 0; attempt < 3; attempt++) {
		try {
			const completion = await chatCompletionCreate(
				[
					{ role: "system", content: systemPrompt },
					{ role: "user", content: userPrompt + correction },
				],
				0.55,
			);
			const raw = completion.choices[0]?.message?.content || "";
			const json = JSON.parse(extractJson(raw)) as unknown;
			const parsed = PlanChatResponseSchema.parse(json);

			if (wantsSuggestions) {
				if (!parsed.suggestions || parsed.suggestions.length !== 3) {
					throw new Error("Expected exactly three suggestions");
				}
				return { message: parsed.message, suggestions: parsed.suggestions };
			}

			return { message: parsed.message, suggestions: null };
		} catch (err) {
			lastError = err;
			correction =
				"\n\nYour previous output was invalid. Return ONLY valid JSON. " +
				(wantsSuggestions
					? 'Include "suggestions" as an array of exactly 3 objects with label and value.'
					: 'Set "suggestions" to null.');
		}
	}

	throw lastError instanceof Error ? lastError : new Error("Plan chat failed");
}
