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

const max429Retries = Math.min(
	10,
	Math.max(0, Number.parseInt(process.env.LLM_429_RETRIES || "2", 10) || 2),
);

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

	for (let attempt = 0; attempt <= max429Retries; attempt++) {
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
			if (attempt >= max429Retries) throw err;

			const header =
				err instanceof APIError && err.headers ? err.headers.get("retry-after") : null;
			const retryAfterSec = header ? Number.parseFloat(header) : Number.NaN;
			const backoffMs = Math.min(90_000, 2000 * 2 ** attempt);
			const waitMs =
				Number.isFinite(retryAfterSec) && retryAfterSec >= 0
					? Math.min(120_000, Math.max(1500, retryAfterSec * 1000))
					: backoffMs;

			console.warn(
				`${logLabel} Model "${model}" rate limited (429). Waiting ${Math.round(waitMs / 1000)}s (retry ${attempt + 1}/${max429Retries})…`,
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
		fallbackModelList(),
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
		const gemModels = [gemPrimary, ...gemExtras.filter((x) => x !== gemPrimary)];

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
		"All numeric budget values are in USD.",
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
