"use client";

import { BaseApp } from "@/components/BaseApp/base-app";
import RequireAuth from "@/components/Auth/RequireAuth";
import { PlanTripContent } from "@/components/Plan/plan-trip-content";

export default function PlanTripPage() {
	return (
		<RequireAuth>
			<BaseApp>
				<PlanTripContent />
			</BaseApp>
		</RequireAuth>
	);
}
