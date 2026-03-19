"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Center, Loader, Text } from "@mantine/core";

import { fetchMe, logout } from "@/lib/auth";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await fetchMe();
        if (!cancelled) setStatus("ready");
      } catch {
        logout();
        if (!cancelled) setStatus("error");
        router.replace("/");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (status === "loading") {
    return (
      <Center style={{ minHeight: 220 }}>
        <Loader />
      </Center>
    );
  }

  if (status === "error") {
    return (
      <Center style={{ minHeight: 220 }}>
        <Alert title="Authorization required" color="red" radius="md">
          <Text>Redirecting to login...</Text>
        </Alert>
      </Center>
    );
  }

  return <>{children}</>;
}

