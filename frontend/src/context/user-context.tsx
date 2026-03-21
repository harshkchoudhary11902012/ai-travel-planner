"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

import { fetchMe, type MeResponse } from "@/lib/auth";
import { getToken } from "@/lib/token";
import type { AuthenticatedUser } from "@/lib/user-display";

export type UserContextValue = {
	user: AuthenticatedUser | null;
	loading: boolean;
	refetch: () => Promise<void>;
};

const UserContext = createContext<UserContextValue | null>(null);

function meToUser(me: MeResponse["user"]): AuthenticatedUser | null {
	if (!me?.email) return null;
	return {
		email: me.email,
		firstName: me.firstName,
		lastName: me.lastName,
	};
}

export function UserProvider({ children }: { children: ReactNode }) {
	const pathname = usePathname();
	const [user, setUser] = useState<AuthenticatedUser | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const token = getToken();
				if (!token) {
					if (!cancelled) setUser(null);
					return;
				}
				const me = await fetchMe();
				if (!cancelled) setUser(meToUser(me.user));
			} catch {
				if (!cancelled) setUser(null);
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [pathname]);

	const refetch = useCallback(async () => {
		try {
			const token = getToken();
			if (!token) {
				setUser(null);
				return;
			}
			const me = await fetchMe();
			setUser(meToUser(me.user));
		} catch {
			setUser(null);
		}
	}, []);

	const value = useMemo(
		() => ({
			user,
			loading,
			refetch,
		}),
		[user, loading, refetch],
	);

	return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextValue {
	const ctx = useContext(UserContext);
	if (!ctx) {
		throw new Error("useUser must be used within a UserProvider");
	}
	return ctx;
}
