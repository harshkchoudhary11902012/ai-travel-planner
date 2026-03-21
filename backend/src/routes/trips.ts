import type { Request, Response } from "express";
import express from "express";
import { z } from "zod";
import { randomUUID } from "crypto";

import { Trip, TripRevision } from "../models";
import { requireAuth } from "../middleware/auth";
import { generateTrip, regenerateDay } from "../services/llm";
import type { TripBudgetType } from "../models/Trip";

const router = express.Router();

const createTripSchema = z.object({
  destination: z.string().min(2),
  days: z.number().int().min(1).max(60),
  budgetType: z.enum(["Low", "Medium", "High"]),
  interests: z.array(z.string().min(1)).optional().default([]),
});

const regenerateDaySchema = z.object({
  instruction: z.string().min(3),
});

const addActivitySchema = z.object({
  title: z.string().min(1),
  notes: z.string().optional().default(""),
});

function activityCount(trip: any) {
  const itinerary = trip?.itinerary || [];
  return itinerary.reduce((sum: number, day: any) => sum + (day?.activities?.length || 0), 0);
}

function activityCostPerType(budgetType: TripBudgetType) {
  if (budgetType === "Low") return 20;
  if (budgetType === "Medium") return 35;
  return 60;
}

function recalcBudget(trip: any) {
  if (!trip?.budget) return;

  const count = activityCount(trip);
  trip.budget.activities = count * activityCostPerType(trip.budgetType as TripBudgetType);
  trip.budget.total =
    (trip.budget.flights || 0) +
    (trip.budget.accommodation || 0) +
    (trip.budget.food || 0) +
    (trip.budget.activities || 0);
}

function makeSnapshot(trip: any) {
  return {
    destination: trip.destination,
    days: trip.days,
    budgetType: trip.budgetType,
    interests: trip.interests,
    itinerary: trip.itinerary,
    budget: trip.budget,
    hotels: trip.hotels,
  };
}

async function loadUserTripOr404(tripId: string | string[] | undefined, userId: string) {
  const tid = Array.isArray(tripId) ? tripId[0] : tripId;
  if (!tid) return null;
  const trip = await Trip.findOne({ _id: tid, userId });
  return trip;
}

router.post("/", requireAuth, async (req: Request, res: Response) => {
  const parsed = createTripSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid trip input" });

  const uid = req.userId!;
  const { destination, days, budgetType, interests } = parsed.data;

  try {
    const llm = await generateTrip({ destination, days, budgetType, interests });

    const trip = await Trip.create({
      userId: uid,
      destination,
      days,
      budgetType,
      interests,
      itinerary: llm.itinerary,
      budget: llm.budget,
      hotels: llm.hotels,
    });

    await TripRevision.create({
      tripId: trip._id,
      userId: uid,
      action: "create",
      note: "Initial trip generation",
      snapshot: makeSnapshot(trip),
    });

    return res.status(201).json(trip);
  } catch (err) {
    console.error("Trip creation error:", err);
    const detail =
      process.env.NODE_ENV !== "production" && err instanceof Error ? err.message : undefined;
    return res.status(500).json({ error: "Trip generation failed", ...(detail ? { detail } : {}) });
  }
});

router.get("/", requireAuth, async (req: Request, res: Response) => {
  const uid = req.userId!;
  const trips = await Trip.find({ userId: uid }).sort({ createdAt: -1 });
  return res.json(trips);
});

router.get("/:tripId", requireAuth, async (req: Request, res: Response) => {
  const uid = req.userId!;
  const tripId = req.params.tripId;

  const trip = await loadUserTripOr404(tripId, uid);
  if (!trip) return res.status(404).json({ error: "Trip not found" });
  return res.json(trip);
});

router.delete("/:tripId", requireAuth, async (req: Request, res: Response) => {
  const uid = req.userId!;
  const tripId = req.params.tripId;

  const trip = await Trip.findOneAndDelete({ _id: tripId, userId: uid });
  if (!trip) return res.status(404).json({ error: "Trip not found" });

  await TripRevision.deleteMany({ tripId: trip._id, userId: uid });
  return res.json({ ok: true });
});

router.post("/:tripId/days/:dayNumber/regenerate", requireAuth, async (req: Request, res: Response) => {
  const uid = req.userId!;
  const tripId = req.params.tripId;
  const dayNumber = Number(req.params.dayNumber);

  const parsed = regenerateDaySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid regenerate request" });

  if (!Number.isInteger(dayNumber) || dayNumber < 1) {
    return res.status(400).json({ error: "Invalid day number" });
  }

  const instruction = parsed.data.instruction;

  try {
    const trip = await loadUserTripOr404(tripId, uid);
    if (!trip) return res.status(404).json({ error: "Trip not found" });

    const existingDay = trip.itinerary.find((d: any) => d.dayNumber === dayNumber);
    const existingActivities = existingDay?.activities || [];

    await TripRevision.create({
      tripId: trip._id,
      userId: uid,
      action: "regenerate_day",
      note: `Regenerate day ${dayNumber}`,
      snapshot: makeSnapshot(trip),
    });

    const updatedDay = await regenerateDay({
      destination: trip.destination,
      days: trip.days,
      budgetType: trip.budgetType,
      interests: trip.interests || [],
      dayNumber,
      instruction,
      existingActivities,
    });

    const idx = trip.itinerary.findIndex((d: any) => d.dayNumber === dayNumber);
    const activities = updatedDay.activities.map((a) => ({
      id: a.id,
      title: a.title,
      notes: a.notes || "",
    }));

    if (idx === -1) {
      trip.itinerary.push({ dayNumber, activities });
    } else {
      (trip.itinerary as any)[idx] = { dayNumber, activities };
    }

    recalcBudget(trip);
    await trip.save();
    return res.json(trip);
  } catch (err) {
    console.error("Regenerate day error:", err);
    return res.status(500).json({ error: "Day regeneration failed" });
  }
});

router.post(
  "/:tripId/days/:dayNumber/activities",
  requireAuth,
  async (req: Request, res: Response) => {
    const uid = req.userId!;
    const tripId = req.params.tripId;
    const dayNumber = Number(req.params.dayNumber);

    const parsed = addActivitySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid activity payload" });

    if (!Number.isInteger(dayNumber) || dayNumber < 1) {
      return res.status(400).json({ error: "Invalid day number" });
    }

    try {
      const trip = await loadUserTripOr404(tripId, uid);
      if (!trip) return res.status(404).json({ error: "Trip not found" });

      const dayIdx = trip.itinerary.findIndex((d: any) => d.dayNumber === dayNumber);

      await TripRevision.create({
        tripId: trip._id,
        userId: uid,
        action: "add_activity",
        note: `Add activity to day ${dayNumber}`,
        snapshot: makeSnapshot(trip),
      });

      if (dayIdx === -1) {
        trip.itinerary.push({ dayNumber, activities: [] });
      }

      const idx = trip.itinerary.findIndex((d: any) => d.dayNumber === dayNumber);
      const newActivity = {
        id: randomUUID(),
        title: parsed.data.title,
        notes: parsed.data.notes || "",
      };
      trip.itinerary[idx].activities.push(newActivity);

      recalcBudget(trip);
      await trip.save();
      return res.status(201).json(trip);
    } catch (err) {
      console.error("Add activity error:", err);
      return res.status(500).json({ error: "Failed to add activity" });
    }
  },
);

router.delete(
  "/:tripId/days/:dayNumber/activities/:activityId",
  requireAuth,
  async (req: Request, res: Response) => {
    const uid = req.userId!;
    const tripId = req.params.tripId;
    const dayNumber = Number(req.params.dayNumber);
    const activityId = req.params.activityId;

    if (!Number.isInteger(dayNumber) || dayNumber < 1) {
      return res.status(400).json({ error: "Invalid day number" });
    }

    try {
      const trip = await loadUserTripOr404(tripId, uid);
      if (!trip) return res.status(404).json({ error: "Trip not found" });

      const day = trip.itinerary.find((d: any) => d.dayNumber === dayNumber);
      if (!day) return res.status(404).json({ error: "Day not found" });

      await TripRevision.create({
        tripId: trip._id,
        userId: uid,
        action: "remove_activity",
        note: `Remove activity ${activityId} from day ${dayNumber}`,
        snapshot: makeSnapshot(trip),
      });

      const before = day.activities.length;
      day.activities = (day.activities as any).filter((a: any) => a.id !== activityId);

      if (day.activities.length === before) {
        return res.status(404).json({ error: "Activity not found" });
      }

      recalcBudget(trip);
      await trip.save();
      return res.json(trip);
    } catch (err) {
      console.error("Remove activity error:", err);
      return res.status(500).json({ error: "Failed to remove activity" });
    }
  },
);

// Revision history (creative feature)
router.get("/:tripId/revisions", requireAuth, async (req: Request, res: Response) => {
  const uid = req.userId!;
  const tripId = req.params.tripId;

  const revisions = await TripRevision.find({ tripId, userId: uid }).sort({ createdAt: -1 });
  return res.json(revisions);
});

router.post("/:tripId/revisions/:revisionId/restore", requireAuth, async (req: Request, res: Response) => {
  const uid = req.userId!;
  const tripId = req.params.tripId;
  const revisionId = req.params.revisionId;

  try {
    const revision = await TripRevision.findOne({ _id: revisionId, tripId, userId: uid });
    if (!revision) return res.status(404).json({ error: "Revision not found" });

    const trip = await loadUserTripOr404(tripId, uid);
    if (!trip) return res.status(404).json({ error: "Trip not found" });

    await TripRevision.create({
      tripId: trip._id,
      userId: uid,
      action: "restore",
      note: `Restore revision ${revisionId}`,
      snapshot: makeSnapshot(trip),
    });

    const snapshot = revision.snapshot as any;
    trip.destination = snapshot.destination;
    trip.days = snapshot.days;
    trip.budgetType = snapshot.budgetType;
    trip.interests = snapshot.interests;
    trip.itinerary = snapshot.itinerary;
    trip.budget = snapshot.budget;
    trip.hotels = snapshot.hotels;

    await trip.save();
    return res.json(trip);
  } catch (err) {
    console.error("Restore revision error:", err);
    return res.status(500).json({ error: "Restore failed" });
  }
});

export default router;

