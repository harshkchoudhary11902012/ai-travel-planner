import mongoose from "mongoose";

export type TripBudgetType = "Low" | "Medium" | "High";

const ActivitySchema = new mongoose.Schema(
  {
    id: { type: String, required: true }, // stable id for edits in the UI
    title: { type: String, required: true },
    notes: { type: String, default: "" },
  },
  { _id: false },
);

const DaySchema = new mongoose.Schema(
  {
    dayNumber: { type: Number, required: true },
    activities: { type: [ActivitySchema], default: [] },
  },
  { _id: false },
);

const HotelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    neighborhood: { type: String, default: "" },
    rating: { type: Number, default: undefined },
    priceTier: { type: String, default: "" }, // e.g. Budget/Mid/Luxury
    website: { type: String, default: "" },
  },
  { _id: false },
);

const TripSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },

    destination: { type: String, required: true, trim: true },
    days: { type: Number, required: true, min: 1, max: 60 },
    budgetType: {
      type: String,
      required: true,
      enum: ["Low", "Medium", "High"],
      index: true,
    },
    interests: { type: [String], default: [] },

    itinerary: { type: [DaySchema], default: [] },

    budget: {
      flights: { type: Number, default: 0 },
      accommodation: { type: Number, default: 0 },
      food: { type: Number, default: 0 },
      activities: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },

    hotels: { type: [HotelSchema], default: [] },
  },
  { timestamps: true },
);

// Ensure user-specific isolation even if someone guesses an ObjectId.
TripSchema.index({ userId: 1, _id: 1 });

export const Trip = mongoose.model("Trip", TripSchema);

