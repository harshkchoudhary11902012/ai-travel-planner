import { Card, Text } from "@mantine/core";

export function SelectableTierCard({
	selected,
	title,
	hint,
	onClick,
	disabled,
}: {
	selected: boolean;
	title: string;
	hint: string;
	onClick: () => void;
	disabled?: boolean;
}) {
	return (
		<Card
			component="button"
			type="button"
			withBorder
			padding="sm"
			radius="md"
			onClick={onClick}
			disabled={disabled}
			style={{
				cursor: disabled ? "not-allowed" : "pointer",
				textAlign: "left",
				width: "100%",
				transition: "border-color 120ms ease, box-shadow 120ms ease",
				borderColor: selected ? "var(--mantine-color-mainColor-filled)" : undefined,
				background: selected
					? "light-dark(var(--mantine-color-mainColor-0), rgba(32, 159, 158, 0.12))"
					: undefined,
				opacity: disabled ? 0.55 : 1,
			}}
		>
			<Text fw={700} size="sm">
				{title}
			</Text>
			<Text size="xs" c="dimmed" mt={4} lh={1.45}>
				{hint}
			</Text>
		</Card>
	);
}
