"use client";

import { useState } from "react";
import { Button, Card, Group, Loader, Stack, Text, Divider, ScrollArea } from "@mantine/core";
import { IconHistory } from "@tabler/icons-react";

import type { TripRevision } from "@/lib/trips";
import { restoreRevision } from "@/lib/trips";

export default function RevisionPanel({
  tripId,
  revisions,
  onRestored,
  loading,
}: {
  tripId: string;
  revisions: TripRevision[];
  onRestored: () => void;
  loading: boolean;
}) {
  const [restoringId, setRestoringId] = useState<string | null>(null);

  async function handleRestore(revisionId: string) {
    setRestoringId(revisionId);
    try {
      await restoreRevision(tripId, revisionId);
      onRestored();
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <Card withBorder p="md" radius="md" style={{ position: "sticky", top: 18 }}>
      <Group justify="space-between" align="center" mb="xs">
        <Group gap="sm">
          <IconHistory size={18} />
          <Text fw={700}>Revision history</Text>
        </Group>
        {loading ? <Loader size="sm" /> : null}
      </Group>

      <Divider my="sm" />

      {revisions.length === 0 ? (
        <Text color="dimmed" size="sm">
          No revisions yet.
        </Text>
      ) : (
        <ScrollArea style={{ height: 420 }}>
          <Stack gap="sm">
            {revisions.map((r) => {
              const isRestoring = restoringId === r._id;
              return (
                <Stack key={r._id} gap={4} style={{ border: "1px solid var(--mantine-color-gray-3)", borderRadius: 10, padding: 12 }}>
                  <Group justify="space-between" align="center">
                    <Text size="sm" fw={700}>
                      {r.action.replace(/_/g, " ")}
                    </Text>
                    <Text size="xs" color="dimmed">
                      {new Date(r.createdAt).toLocaleString()}
                    </Text>
                  </Group>
                  <Text size="sm" color="dimmed" lineClamp={2}>
                    {r.note}
                  </Text>
                  <Button
                    size="xs"
                    variant="light"
                    color="blue"
                    onClick={() => handleRestore(r._id)}
                    loading={isRestoring}
                    disabled={isRestoring}
                  >
                    Restore
                  </Button>
                </Stack>
              );
            })}
          </Stack>
        </ScrollArea>
      )}
    </Card>
  );
}

