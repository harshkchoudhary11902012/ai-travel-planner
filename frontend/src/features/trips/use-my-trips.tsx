"use client";

import { useCallback, useEffect, useState } from "react";
import { Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { showNotification } from "@mantine/notifications";

import type { Trip } from "@/lib/trips";
import { deleteTrip, listTrips } from "@/lib/trips";

export type UseMyTripsResult = {
	trips: Trip[] | null;
	error: string | null;
	deletingId: string | null;
	confirmDeleteTrip: (trip: Trip) => void;
};

export function useMyTrips(): UseMyTripsResult {
	const [trips, setTrips] = useState<Trip[] | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [deletingId, setDeletingId] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		listTrips()
			.then((data) => {
				if (!cancelled) setTrips(data);
			})
			.catch((e) => {
				if (!cancelled) {
					setError(e instanceof Error ? e.message : "Failed to load trips");
					setTrips([]);
				}
			});
		return () => {
			cancelled = true;
		};
	}, []);

	const confirmDeleteTrip = useCallback((trip: Trip) => {
		modals.openConfirmModal({
			title: "Delete trip permanently?",
			children: (
				<Text size="sm">
					This removes <strong>{trip.destination}</strong> and its revision history. You cannot
					undo this.
				</Text>
			),
			labels: { confirm: "Delete", cancel: "Cancel" },
			confirmProps: { color: "red" },
			onConfirm: async () => {
				setDeletingId(trip._id);
				try {
					await deleteTrip(trip._id);
					setTrips((prev) => (prev ? prev.filter((t) => t._id !== trip._id) : prev));
					showNotification({
						title: "Trip deleted",
						message: `${trip.destination} was removed.`,
						color: "orange",
						position: "top-center",
					});
				} catch (e) {
					showNotification({
						title: "Could not delete trip",
						message: e instanceof Error ? e.message : "Request failed",
						color: "red",
						position: "top-center",
					});
				} finally {
					setDeletingId(null);
				}
			},
		});
	}, []);

	return { trips, error, deletingId, confirmDeleteTrip };
}
