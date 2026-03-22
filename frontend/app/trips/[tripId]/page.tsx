"use client";

import { useParams } from "next/navigation";

import { BaseApp } from "@/components/BaseApp/base-app";
import RequireAuth from "@/components/Auth/RequireAuth";
import { TripDetailContent } from "@/components/Trip/trip-detail-content";

export default function TripPage() {
	const params = useParams<{ tripId: string }>();
	return (
		<RequireAuth>
			<BaseApp>
				<TripDetailContent tripId={params.tripId} />
			</BaseApp>
		</RequireAuth>
	);
}
