"use client";

import { Loader, Stack, Text } from "@mantine/core";

type AuthTransitionOverlayProps = {
  message: string;
};

/** Full-viewport loader while auth completes and navigation runs */
export function AuthTransitionOverlay({ message }: AuthTransitionOverlayProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10_000,
        backgroundColor: "rgba(248, 250, 252, 0.94)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <Stack align="center" gap="lg">
        <Loader size={48} color="teal" type="oval" />
        <Text size="md" fw={600} ta="center" maw={320} c="dark.7">
          {message}
        </Text>
      </Stack>
    </div>
  );
}
