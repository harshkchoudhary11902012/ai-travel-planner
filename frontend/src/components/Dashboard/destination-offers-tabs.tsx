"use client";

import Image from "next/image";
import { Card, Group, SimpleGrid, Stack, Tabs, Text, Title } from "@mantine/core";
import { IconMapPin } from "@tabler/icons-react";

import { formatCostInINR } from "@/lib/currency";

export type DestinationOffer = {
	id: string;
	image: string;
	destination: string;
	country: string;
	pricePerDay: number;
};

function OfferCard({ item }: { item: DestinationOffer }) {
	return (
		<Card padding={0} radius="md" withBorder style={{ overflow: "hidden" }}>
			<Card.Section>
				<div style={{ position: "relative", width: "100%", height: 140 }}>
					<Image
						src={item.image}
						alt={item.destination}
						fill
						sizes="(max-width: 768px) 100vw, 25vw"
						style={{ objectFit: "cover" }}
					/>
				</div>
			</Card.Section>
			<Stack gap={6} p="md">
				<Text fw={700} lineClamp={1}>
					{item.destination}
				</Text>
				<Group gap={6} wrap="nowrap">
					<IconMapPin size={16} stroke={1.5} aria-hidden style={{ flexShrink: 0 }} />
					<Text size="sm" c="dimmed" lineClamp={1}>
						{item.country}
					</Text>
				</Group>
				<Text size="sm" fw={700} c="mainColor">
					{formatCostInINR(item.pricePerDay)}/day
				</Text>
			</Stack>
		</Card>
	);
}

function OfferGrid({ items }: { items: DestinationOffer[] }) {
	return (
		<SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
			{items.map((item) => (
				<OfferCard key={item.id} item={item} />
			))}
		</SimpleGrid>
	);
}

const MOST_POPULAR: DestinationOffer[] = [
	{
		id: "p1",
		image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80",
		destination: "Paris",
		country: "France",
		pricePerDay: 420,
	},
	{
		id: "p2",
		image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80",
		destination: "Tokyo",
		country: "Japan",
		pricePerDay: 380,
	},
	{
		id: "p3",
		image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
		destination: "New York",
		country: "United States",
		pricePerDay: 450,
	},
	{
		id: "p4",
		image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
		destination: "Dubai",
		country: "United Arab Emirates",
		pricePerDay: 400,
	},
];

const SPECIAL_OFFERS: DestinationOffer[] = [
	{
		id: "s1",
		image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80",
		destination: "Bali",
		country: "Indonesia",
		pricePerDay: 185,
	},
	{
		id: "s2",
		image: "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=800&q=80",
		destination: "Lisbon",
		country: "Portugal",
		pricePerDay: 220,
	},
	{
		id: "s3",
		image: "https://images.unsplash.com/photo-1541849546-216549ae216d?w=800&q=80",
		destination: "Prague",
		country: "Czech Republic",
		pricePerDay: 195,
	},
	{
		id: "s4",
		image: "https://images.unsplash.com/photo-1557750255-c76072a7aad1?w=800&q=80",
		destination: "Hanoi",
		country: "Vietnam",
		pricePerDay: 165,
	},
];

const NEAR_ME: DestinationOffer[] = [
	{
		id: "n1",
		image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80",
		destination: "Big Sur",
		country: "United States",
		pricePerDay: 340,
	},
	{
		id: "n2",
		image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
		destination: "Lake Tahoe",
		country: "United States",
		pricePerDay: 290,
	},
	{
		id: "n3",
		image:
			"https://images.unsplash.com/photo-1551650918-329737f129cd?w=800&q=80&auto=format&fit=crop",
		destination: "Joshua Tree",
		country: "United States",
		pricePerDay: 285,
	},
	{
		id: "n4",
		image: "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&q=80",
		destination: "Santa Barbara",
		country: "United States",
		pricePerDay: 360,
	},
];

export function DestinationOffersTabs() {
	return (
		<Tabs defaultValue="popular" radius="md">
			<Tabs.List grow>
				<Tabs.Tab value="popular">Most Popular</Tabs.Tab>
				<Tabs.Tab value="offers">Special Offers</Tabs.Tab>
				<Tabs.Tab value="near">Near me</Tabs.Tab>
			</Tabs.List>

			<Tabs.Panel value="popular" pt="md">
				<Title order={5} mb="sm">
					Trending right now
				</Title>
				<OfferGrid items={MOST_POPULAR} />
			</Tabs.Panel>

			<Tabs.Panel value="offers" pt="md">
				<Title order={5} mb="sm">
					Limited-time value picks
				</Title>
				<OfferGrid items={SPECIAL_OFFERS} />
			</Tabs.Panel>

			<Tabs.Panel value="near" pt="md">
				<Title order={5} mb="sm">
					Weekend-ready nearby
				</Title>
				<OfferGrid items={NEAR_ME} />
			</Tabs.Panel>
		</Tabs>
	);
}
