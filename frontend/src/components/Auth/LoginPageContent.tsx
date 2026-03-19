"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	Anchor,
	Alert,
	Button,
	Checkbox,
	PasswordInput,
	Stack,
	Text,
	TextInput,
	Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";

import { AuthSocialButtons } from "@/components/Auth/AuthSocialButtons";
import { AuthSplitLayout } from "@/components/Auth/AuthSplitLayout";
import { AuthTransitionOverlay } from "@/components/Auth/AuthTransitionOverlay";
import authPage from "@/components/Auth/authPage.module.css";
import { authFieldStyles } from "@/components/Auth/authFieldStyles";
import { login } from "@/lib/auth";

export function LoginPageContent() {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	const [remember, setRemember] = useState(false);
	const [transitionMessage, setTransitionMessage] = useState<string | null>(null);

	const form = useForm({
		initialValues: {
			email: "",
			password: "",
		},
		validate: {
			email: (value) => (value.trim().length ? null : "Email is required"),
			password: (value) =>
				value.length >= 6 ? null : "Password must be at least 6 characters",
		},
	});

	return (
		<>
			{transitionMessage ? <AuthTransitionOverlay message={transitionMessage} /> : null}
			<AuthSplitLayout progressFilled={2}>
				<Stack gap="xl" maw={480} w="100%" miw={0}>
					<div>
						<Title
							order={1}
							fw={800}
							fz="clamp(1.65rem, 4vw, 2.15rem)"
							lh={1.2}
							className={authPage.pageTitle}
						>
							Welcome back
						</Title>
						<Text size="md" mt="sm" maw={400} className={authPage.subtitle}>
							Log in to keep planning—your itineraries and revision history are
							waiting.
						</Text>
					</div>

					{error ? (
						<Alert color="red" title="Login failed" variant="light" radius="md">
							{error}
						</Alert>
					) : null}

					<form
						onSubmit={form.onSubmit(async (values) => {
							setError(null);
							setTransitionMessage("Signing you in…");
							try {
								await login(values);
								showNotification({
									title: "Successfully logged in",
									message: "Taking you to your dashboard.",
									color: "teal",
									position: "top-center",
									autoClose: 5000,
									withCloseButton: true,
								});
								setTransitionMessage("Opening your dashboard…");
								// await new Promise((r) => setTimeout(r, 1000));
								router.replace("/dashboard");
							} catch (e) {
								setTransitionMessage(null);
								setError(e instanceof Error ? e.message : "Login failed");
							}
						})}
					>
						<Stack gap="lg">
							<TextInput
								label="Email"
								placeholder="ex: you@gmail.com"
								styles={authFieldStyles}
								{...form.getInputProps("email")}
								autoComplete="email"
							/>
							<PasswordInput
								label="Password"
								placeholder="Enter your password"
								styles={authFieldStyles}
								{...form.getInputProps("password")}
								autoComplete="current-password"
							/>

							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									flexWrap: "wrap",
									gap: "0.5rem",
								}}
							>
								<Checkbox
									label="Remember me"
									checked={remember}
									onChange={(e) => setRemember(e.currentTarget.checked)}
									size="sm"
									styles={{
										label: { fontSize: 13, fontWeight: 500, color: "#475569" },
									}}
								/>
								<Anchor
									component={Link}
									href="/forgot-password"
									size="sm"
									fw={600}
									c="teal.8"
								>
									Forgot password?
								</Anchor>
							</div>

							<Button
								type="submit"
								fullWidth
								size="lg"
								radius="md"
								disabled={!!transitionMessage}
								color="teal"
								styles={{
									root: {
										fontWeight: 700,
										letterSpacing: "0.03em",
										boxShadow: "0 10px 28px rgba(15, 118, 110, 0.32)",
									},
								}}
							>
								Log in
							</Button>
						</Stack>
					</form>

					<Text ta="center" size="sm" c="dimmed">
						Don&apos;t have an account?{" "}
						<Anchor component={Link} href="/signup" fw={700} c="teal.8">
							Create one—it&apos;s free
						</Anchor>
					</Text>

					<AuthSocialButtons />
				</Stack>
			</AuthSplitLayout>
		</>
	);
}
