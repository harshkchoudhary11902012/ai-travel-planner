"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Alert,
  Badge,
  Button,
  Card,
  Center,
  Container,
  Group,
  Grid,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";

import RequireAuth from "@/components/RequireAuth";
import DayPanel from "@/components/Trip/DayPanel";
import RevisionPanel from "@/components/Trip/RevisionPanel";
import type { Trip, TripRevision } from "@/lib/trips";
import { getRevisions, getTrip } from "@/lib/trips";

export default function TripPage() {
  const params = useParams<{ tripId: string }>();
  const tripId = params.tripId;

  return (
    <RequireAuth>
      <TripInner tripId={tripId} />
    </RequireAuth>
  );
}

function TripInner({ tripId }: { tripId: string }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [trip, setTrip] = useState<Trip | null>(null);
  const [revisions, setRevisions] = useState<TripRevision[]>([]);
  const [revisionsLoading, setRevisionsLoading] = useState(false);

  const orderedDays = useMemo(() => {
    return (trip?.itinerary || []).slice().sort((a, b) => a.dayNumber - b.dayNumber);
  }, [trip]);

  const refetchAll = useCallback(async () => {
    if (!tripId) return;
    setRevisionsLoading(true);
    try {
      const [t, r] = await Promise.all([getTrip(tripId), getRevisions(tripId)]);
      setTrip(t);
      setRevisions(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load trip");
    } finally {
      setRevisionsLoading(false);
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await refetchAll();
      if (!cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [refetchAll]);

  async function handleMutation() {
    setSaving(true);
    try {
      await refetchAll();
    } finally {
      setSaving(false);
    }
  }

  if (loading || !trip) {
    return (
      <Center style={{ minHeight: 320 }}>
        <Loader />
      </Center>
    );
  }

  return (
    <Container size={1200} style={{ paddingTop: 24, paddingBottom: 60 }}>
      <Group justify="space-between" align="flex-start" mb="md">
        <Stack gap={4}>
          <Title order={2}>Trip: {trip.destination}</Title>
          <Group gap="xs">
            <Badge>{trip.days} day(s)</Badge>
            <Badge variant="light">{trip.budgetType} budget</Badge>
          </Group>
        </Stack>
        <Group>
          <Button variant="subtle" onClick={() => router.replace("/dashboard")} disabled={saving}>
            Back
          </Button>
        </Group>
      </Group>

      {error ? <Alert color="red" mb="md">{error}</Alert> : null}

      <Grid gutter="xl" align="start">
        <Grid.Col span={8}>
          <Card withBorder p="md" radius="md" mb="md">
            <Stack gap="xs">
              <Text fw={700}>Estimated budget</Text>
              <SimpleGrid cols={2}>
                <Text size="sm" color="dimmed">Flights: ${trip.budget.flights}</Text>
                <Text size="sm" color="dimmed">Accommodation: ${trip.budget.accommodation}</Text>
                <Text size="sm" color="dimmed">Food: ${trip.budget.food}</Text>
                <Text size="sm" color="dimmed">Activities: ${trip.budget.activities}</Text>
              </SimpleGrid>
              <Text size="lg" fw={800}>
                Total: ${trip.budget.total}
              </Text>
            </Stack>
          </Card>

          <Card withBorder p="md" radius="md" mb="md">
            <Stack gap="xs">
              <Text fw={700}>Recommended hotels</Text>
              <Grid gutter={8}>
                {trip.hotels.map((h, idx) => (
                  <Grid.Col span={6} key={`${h.name}-${idx}`}>
                    <Card shadow="none" padding="sm" radius="md" withBorder>
                      <Stack gap={2}>
                        <Text fw={700}>{h.name}</Text>
                        {h.neighborhood ? <Text size="sm" color="dimmed">{h.neighborhood}</Text> : null}
                        {typeof h.rating === "number" ? (
                          <Text size="sm">Rating: {h.rating.toFixed(1)}/5</Text>
                        ) : (
                          <Text size="sm" color="dimmed">Rating: N/A</Text>
                        )}
                        {h.priceTier ? <Text size="sm" color="dimmed">{h.priceTier} tier</Text> : null}
                      </Stack>
                    </Card>
                  </Grid.Col>
                ))}
              </Grid>
            </Stack>
          </Card>

          <Stack gap="md">
            {orderedDays.map((day) => (
              <DayPanel
                key={day.dayNumber}
                tripId={trip._id}
                day={day}
                budgetType={trip.budgetType}
                onMutation={handleMutation}
              />
            ))}
          </Stack>
        </Grid.Col>

        <Grid.Col span={4}>
          <RevisionPanel
            tripId={trip._id}
            revisions={revisions}
            onRestored={handleMutation}
            loading={revisionsLoading}
          />
        </Grid.Col>
      </Grid>
    </Container>
  );
}

