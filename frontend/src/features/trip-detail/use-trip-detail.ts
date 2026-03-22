"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { Trip, TripRevision } from "@/lib/trips";
import { getRevisions, getTrip } from "@/lib/trips";

export function useTripDetail(tripId: string) {
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [trip, setTrip] = useState<Trip | null>(null);
	const [revisions, setRevisions] = useState<TripRevision[]>([]);
	const [revisionsLoading, setRevisionsLoading] = useState(false);

	const orderedDays = useMemo(() => {
		return (trip?.itinerary || []).slice().sort((a, b) => a.dayNumber - b.dayNumber);
	}, [trip]);

	const refetchAll = useCallback(async () => {
		if (!tripId) return;
		setRevisionsLoading(true);
		try {
			const [t, r] = await Promise.all([getTrip(tripId), getRevisions(tripId)]);
			setTrip(t);
			setRevisions(r);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to load trip");
		} finally {
			setRevisionsLoading(false);
			setLoading(false);
		}
	}, [tripId]);

	useEffect(() => {
		void refetchAll();
	}, [refetchAll]);

	const handleMutation = useCallback(async () => {
		setSaving(true);
		try {
			await refetchAll();
		} finally {
			setSaving(false);
		}
	}, [refetchAll]);

	return {
		loading,
		saving,
		error,
		trip,
		revisions,
		revisionsLoading,
		orderedDays,
		handleMutation,
	};
}
