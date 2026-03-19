import OpenAI from "openai";
import { z } from "zod";

import type { TripBudgetType } from "../models/Trip";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  // Fail fast for dev; in production you will need OPENAI_API_KEY set.
  console.error("Missing OPENAI_API_KEY");
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY || "missing-api-key",
});

const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

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

  // Let JSON.parse throw with useful message.
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

  for (let attempt = 0; attempt <= retries; attempt++) {
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
    });

    const content = completion.choices[0]?.message?.content || "";
    try {
      const json = JSON.parse(extractJson(content)) as unknown;
      const parsed = schema.parse(json);
      return parsed;
    } catch (err) {
      lastError = err;
    }

    if (attempt < retries) {
      const correctionPrompt = `Your previous output did not match the expected schema.\n\nPlease return ONLY valid JSON matching the schema keys exactly.\n\nNote: Do not include markdown, code fences, or trailing commentary.`;

      userPrompt = `${userPrompt}\n\n${correctionPrompt}`;
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
  const promptInterests = input.interests.length ? input.interests.join(", ") : "general sightseeing";

  const budgetTypeHint =
    input.budgetType === "Low"
      ? "Budget"
      : input.budgetType === "Medium"
        ? "Mid"
        : "Luxury";

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

  // Ensure budget.total matches our parsed numbers. If model gave inconsistent numbers, fix safely.
  const computedTotal =
    parsed.budget.flights + parsed.budget.accommodation + parsed.budget.food + parsed.budget.activities;

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

  const existing = input.existingActivities
    .map((a) => `- ${a.title} (id=${a.id})`)
    .join("\n");

  const promptInterests = input.interests.length ? input.interests.join(", ") : "general sightseeing";

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

