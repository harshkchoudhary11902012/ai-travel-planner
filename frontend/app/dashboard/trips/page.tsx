"use client";

import { BaseApp } from "@/components/BaseApp/base-app";
import RequireAuth from "@/components/Auth/RequireAuth";
import { MyTripsContent } from "@/components/Trips/my-trips-content";

export default function MyTripsPage() {
	return (
		<RequireAuth>
			<BaseApp>
				<MyTripsContent />
			</BaseApp>
		</RequireAuth>
	);
}
