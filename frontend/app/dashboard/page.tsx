"use client";

import { BaseApp } from "@/components/BaseApp/base-app";
import RequireAuth from "@/components/Auth/RequireAuth";
import { DashboardHomeContent } from "@/components/Dashboard/dashboard-home-content";

export default function DashboardPage() {
	return (
		<RequireAuth>
			<BaseApp>
				<DashboardHomeContent />
			</BaseApp>
		</RequireAuth>
	);
}
