"use client";

import { useEffect, useState } from "react";

import { useUser } from "@/context/user-context";
import type { Trip } from "@/lib/trips";
import { listTrips } from "@/lib/trips";

export function useDashboardData() {
	const { user, loading: userLoading } = useUser();
	const [trips, setTrips] = useState<Trip[] | null>(null);

	useEffect(() => {
		let cancelled = false;
		listTrips()
			.then((data) => {
				if (!cancelled) setTrips(data);
			})
			.catch(() => {
				if (!cancelled) setTrips([]);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	return { user, userLoading, trips };
}
