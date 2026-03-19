"use client";

import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Text, Title } from "@mantine/core";
import { IconArrowLeft, IconPlane, IconSparkles } from "@tabler/icons-react";

import styles from "./AuthSplitLayout.module.css";

export type HeroSlide = {
	src: string;
	title: string;
	description?: string;
};

const DEFAULT_SLIDES: HeroSlide[] = [
	{
		src: "https://images.unsplash.com/photo-1773758706361-ca25411b065a?q=80&w=927&auto=format&fit=crop",
		title: "Designed around your dreams",
		description: "Tailor-made trips start with your preferences and grow with every edit.",
	},
	{
		src: "https://images.unsplash.com/photo-1772616983875-03ca7293c933?q=80&w=927&auto=format&fit=crop",
		title: "Join thousands of travelers worldwide",
		description: "Discover itineraries, budgets, and stays—refined by AI, controlled by you.",
	},
	{
		src: "https://images.unsplash.com/photo-1557093793-d149a38a1be8?q=80&w=1287&auto=format&fit=crop",
		title: "Every horizon, within reach",
		description: "From weekend escapes to multi-week routes—plan calmly in one workspace.",
	},
];

export type AuthSplitLayoutProps = {
	children: ReactNode;
	/** Hero carousel (defaults to scenic travel photography) */
	slides?: HeroSlide[];
	/** Omit on the main entry screen (login at `/`) */
	backHref?: string;
	backLabel?: string;
	/** Filled segments in the top progress bar (e.g. 2 of 4) */
	progressFilled: number;
	progressTotal?: number;
};

export function AuthSplitLayout({
	children,
	slides = DEFAULT_SLIDES,
	backHref,
	backLabel = "Back",
	progressFilled,
	progressTotal = 4,
}: AuthSplitLayoutProps) {
	const showBack = Boolean(backHref);
	const [active, setActive] = useState(0);
	const safeSlides = slides.length > 0 ? slides : DEFAULT_SLIDES;

	useEffect(() => {
		if (safeSlides.length <= 1) return;
		const t = setInterval(() => {
			setActive((i) => (i + 1) % safeSlides.length);
		}, 6500);
		return () => clearInterval(t);
	}, [safeSlides.length]);

	const slide = safeSlides[active]!;
	const filled = Math.min(Math.max(0, progressFilled), progressTotal);

	return (
		<div className={styles.shell}>
			<div className={styles.grid}>
				<div className={styles.left}>
					<div
						className={styles.topRow}
						style={{ justifyContent: showBack ? "space-between" : "flex-end" }}
					>
						{showBack && backHref ? (
							<Link href={backHref} className={styles.back}>
								<IconArrowLeft size={16} stroke={2} aria-hidden />
								{backLabel}
							</Link>
						) : null}
						<div className={styles.stepper} aria-hidden>
							{Array.from({ length: progressTotal }, (_, i) => (
								<span
									key={i}
									className={`${styles.stepSegment} ${i < filled ? styles.stepSegmentFilled : ""}`}
								/>
							))}
						</div>
					</div>

					<div className={styles.brandRow}>
						<div className={styles.logoMark} aria-hidden>
							<IconPlane size={22} stroke={1.8} />
						</div>
						<span className={styles.brandName}>AI Travel Planner</span>
						<span className={styles.badge}>
							<IconSparkles size={12} stroke={2} aria-hidden />
							Powered by AI
						</span>
					</div>

					<div className={styles.formArea}>{children}</div>

					<Text component="p" className={styles.terms}>
						By continuing, you agree to our{" "}
						<button type="button" className={styles.termsBtn}>
							Terms of Service
						</button>{" "}
						and{" "}
						<button type="button" className={styles.termsBtn}>
							Privacy Policy
						</button>
						.
					</Text>
				</div>

				<aside className={styles.right} aria-label="Travel highlights">
					<Image
						src={slide.src}
						alt=""
						fill
						priority={active === 0}
						className={styles.heroImage}
						sizes="(max-width: 960px) 100vw, 50vw"
					/>
					<div className={styles.heroOverlay} />
					<div className={styles.heroContent}>
						<Title order={2} className={styles.heroTitle}>
							{slide.title}
						</Title>
						{slide.description ? (
							<Text component="p" className={styles.heroText}>
								{slide.description}
							</Text>
						) : null}
					</div>
					{safeSlides.length > 1 ? (
						<div className={styles.dots} role="tablist" aria-label="Hero images">
							{safeSlides.map((_, i) => (
								<button
									key={i}
									type="button"
									className={`${styles.dot} ${i === active ? styles.dotActive : ""}`}
									aria-label={`Show slide ${i + 1}`}
									aria-current={i === active ? "true" : undefined}
									onClick={() => setActive(i)}
								/>
							))}
						</div>
					) : null}
				</aside>
			</div>
		</div>
	);
}
