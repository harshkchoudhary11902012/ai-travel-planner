import type { Request, Response } from "express";
import express from "express";
import { z } from "zod";

import { requireAuth } from "../middleware/auth";
import { PLAN_CHAT_PHASES, planAssistantResponse, type PlanChatPhase } from "../services/llm";

const router = express.Router();

const phaseList = PLAN_CHAT_PHASES as readonly string[];

const bodySchema = z.object({
	phase: z
		.string()
		.refine((s): s is PlanChatPhase => phaseList.includes(s), { message: "Invalid phase" }),
	userMessage: z.string().optional(),
	context: z.record(z.string(), z.string()).optional(),
});

router.post("/chat", requireAuth, async (req: Request, res: Response) => {
	const parsed = bodySchema.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ error: "Invalid plan chat input" });

	try {
		const out = await planAssistantResponse({
			phase: parsed.data.phase,
			userMessage: parsed.data.userMessage,
			context: parsed.data.context,
		});
		return res.json(out);
	} catch (err) {
		console.error("Plan chat error:", err);
		const detail =
			process.env.NODE_ENV !== "production" && err instanceof Error ? err.message : undefined;
		return res.status(500).json({ error: "Plan assistant failed", ...(detail ? { detail } : {}) });
	}
});

export default router;
