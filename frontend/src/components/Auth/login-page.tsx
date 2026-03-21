"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	Anchor,
	Alert,
	Button,
	Checkbox,
	Flex,
	PasswordInput,
	Stack,
	Text,
	TextInput,
	Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { LoginPageContainer } from "@/components/Auth/login-page-container";
import { SsoLogins } from "@/components/Auth/sso-logins";
import { login } from "@/lib/auth";

export default function LoginPage() {
	const router = useRouter();

	const [error, setError] = useState<string | null>(null);
	const [remember, setRemember] = useState(false);

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
			<LoginPageContainer>
				<Stack>
					<Title order={1}>Welcome back</Title>
					<Text fz={15}>
						Log in to keep planning—your itineraries and revision history are waiting.
					</Text>

					{error ? (
						<Alert color="red" title="Login failed" variant="light" radius="md">
							{error}
						</Alert>
					) : null}

					<form
						onSubmit={form.onSubmit(async (values) => {
							setError(null);
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
								router.replace("/dashboard");
							} catch (e) {
								setError(e instanceof Error ? e.message : "Login failed");
							}
						})}
					>
						<Stack gap="lg">
							<TextInput
								label="Email"
								placeholder="ex: you@gmail.com"
								{...form.getInputProps("email")}
								autoComplete="email"
							/>
							<PasswordInput
								label="Password"
								placeholder="Enter your password"
								{...form.getInputProps("password")}
								autoComplete="current-password"
							/>

							<Flex justify="space-between" align="center" wrap="wrap">
								<Checkbox
									label="Remember me"
									checked={remember}
									onChange={(e) => setRemember(e.currentTarget.checked)}
								/>
								<Anchor component={Link} href="/forgot-password">
									Forgot password?
								</Anchor>
							</Flex>

							<Button type="submit" radius="md">
								Log in
							</Button>
						</Stack>
					</form>

					<Text ta="center" size="sm" c="dimmed">
						Don&apos;t have an account?{" "}
						<Anchor component={Link} href="/signup" fw={700}>
							Create Account
						</Anchor>
					</Text>

					<SsoLogins />
				</Stack>
			</LoginPageContainer>
		</>
	);
}
