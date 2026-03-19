import mongoose from "mongoose";

export type TripRevisionAction =
  | "create"
  | "add_activity"
  | "remove_activity"
  | "regenerate_day"
  | "restore";

const TripRevisionSchema = new mongoose.Schema(
  {
    tripId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    userId: { type: String, required: true, index: true },

    action: { type: String, required: true },
    note: { type: String, default: "" },

    // Snapshot of the trip at the time of the mutation
    snapshot: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
);

TripRevisionSchema.index({ tripId: 1, userId: 1, createdAt: -1 });

export const TripRevision = mongoose.model("TripRevision", TripRevisionSchema);

