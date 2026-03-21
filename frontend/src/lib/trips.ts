import { api } from "./api";

export type TripBudget = {
  flights: number;
  accommodation: number;
  food: number;
  activities: number;
  total: number;
};

export type TripActivity = {
  id: string;
  title: string;
  notes: string;
};

export type TripDay = {
  dayNumber: number;
  activities: TripActivity[];
};

export type TripHotel = {
  name: string;
  neighborhood: string;
  rating?: number;
  priceTier?: string;
  website?: string;
};

export type Trip = {
  _id: string;
  userId: string;
  destination: string;
  days: number;
  budgetType: "Low" | "Medium" | "High";
  interests: string[];
  itinerary: TripDay[];
  budget: TripBudget;
  hotels: TripHotel[];
  createdAt?: string;
  updatedAt?: string;
};

export type TripRevision = {
  _id: string;
  createdAt: string;
  action: string;
  note: string;
};

export async function listTrips() {
  return api<Trip[]>("/api/trips", { method: "GET" });
}

export async function getTrip(tripId: string) {
  return api<Trip>(`/api/trips/${tripId}`, { method: "GET" });
}

export async function addActivity(tripId: string, dayNumber: number, input: { title: string; notes?: string }) {
  return api<Trip>(`/api/trips/${tripId}/days/${dayNumber}/activities`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function removeActivity(
  tripId: string,
  dayNumber: number,
  activityId: string,
) {
  return api<Trip>(`/api/trips/${tripId}/days/${dayNumber}/activities/${activityId}`, {
    method: "DELETE",
  });
}

export async function regenerateDay(
  tripId: string,
  dayNumber: number,
  instruction: string,
) {
  return api<Trip>(`/api/trips/${tripId}/days/${dayNumber}/regenerate`, {
    method: "POST",
    body: JSON.stringify({ instruction }),
  });
}

export async function getRevisions(tripId: string) {
  return api<TripRevision[]>(`/api/trips/${tripId}/revisions`, { method: "GET" });
}

export async function restoreRevision(tripId: string, revisionId: string) {
  return api<Trip>(`/api/trips/${tripId}/revisions/${revisionId}/restore`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

