"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	Alert,
	Anchor,
	Button,
	Checkbox,
	PasswordInput,
	SimpleGrid,
	Stack,
	Text,
	TextInput,
	Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";

import { LoginPageContainer } from "@/components/Auth/login-page-container";
import { SsoLogins } from "@/components/Auth/sso-logins";
import { login, signup } from "@/lib/auth";

export default function SignupPage() {
	const router = useRouter();

	const [error, setError] = useState<string | null>(null);
	const [remember, setRemember] = useState(false);

	const form = useForm({
		initialValues: {
			firstName: "",
			lastName: "",
			email: "",
			password: "",
		},
		validate: {
			firstName: (v) => (v.trim().length ? null : "First name is required"),
			lastName: (v) => (v.trim().length ? null : "Last name is required"),
			email: (value) => (value.trim().length ? null : "Email is required"),
			password: (value) =>
				value.length >= 6 ? null : "Password must be at least 6 characters",
		},
	});

	return (
		<>
			<LoginPageContainer backHref="/">
				<Stack>
					<Title order={1}>Create your account</Title>
					<Text fz={15}>
						Join AI Travel Planner and start building itineraries effortlessly—it&apos;s
						free.
					</Text>

					{error ? (
						<Alert color="red" title="Sign up failed" variant="light" radius="md">
							{error}
						</Alert>
					) : null}

					<form
						onSubmit={form.onSubmit(async (values) => {
							setError(null);
							try {
								await signup({ email: values.email, password: values.password });
								await login({ email: values.email, password: values.password });
								showNotification({
									title: "Successfully signed in",
									message: "Your account is ready. Opening your dashboard.",
									color: "teal",
								});
								router.replace("/dashboard");
							} catch (e) {
								setError(e instanceof Error ? e.message : "Sign up failed");
							}
						})}
					>
						<Stack gap="lg">
							<SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
								<TextInput
									label="First name"
									placeholder="Enter your first name"
									{...form.getInputProps("firstName")}
									autoComplete="given-name"
								/>
								<TextInput
									label="Last name"
									placeholder="Enter your last name"
									{...form.getInputProps("lastName")}
									autoComplete="family-name"
								/>
							</SimpleGrid>
							<TextInput
								label="Email"
								placeholder="ex: you@gmail.com"
								{...form.getInputProps("email")}
								autoComplete="email"
							/>
							<PasswordInput
								label="Password"
								placeholder="Create a strong password"
								{...form.getInputProps("password")}
								autoComplete="new-password"
							/>

							<Checkbox
								label="Remember me"
								checked={remember}
								onChange={(e) => setRemember(e.currentTarget.checked)}
							/>

							<Button type="submit" radius="md">
								Create account
							</Button>
						</Stack>
					</form>

					<Text ta="center" size="sm" c="dimmed">
						Already have an account?{" "}
						<Anchor component={Link} href="/" fw={700}>
							Log in
						</Anchor>
					</Text>

					<SsoLogins />
				</Stack>
			</LoginPageContainer>
		</>
	);
}
