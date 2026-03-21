"use client";

import { useState } from "react";
import Link from "next/link";
import { Alert, Anchor, Button, Stack, Text, TextInput, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";

import { LoginPageContainer } from "@/components/Auth/login-page-container";

export default function ForgetPasswordPage() {
	const [submitted, setSubmitted] = useState(false);

	const form = useForm({
		initialValues: { email: "" },
		validate: {
			email: (value) => (/^\S+@\S+$/.test(value.trim()) ? null : "Enter a valid email"),
		},
	});

	return (
		<LoginPageContainer backHref="/">
			<Stack flex={1} miw={0} gap="md" justify="flex-start" align="stretch">
				<Title order={1}>Forgot password?</Title>
				<Text fz={15}>
					Enter the email you used to register. When email reset is enabled on the server,
					you&apos;ll receive a link to choose a new password.
				</Text>

				{submitted ? (
					<Alert color="teal" title="Request recorded" variant="light" radius="md">
						If an account exists for that address, you&apos;ll get instructions once the
						backend sends mail.{" "}
						<Anchor component={Link} href="/" fw={700} c="teal.8">
							Back to login
						</Anchor>
					</Alert>
				) : null}

				<form
					onSubmit={form.onSubmit(() => {
						setSubmitted(true);
						showNotification({
							title: "Request recorded",
							message:
								"This demo API doesn’t send reset emails yet—hook up your mailer when you’re ready.",
							color: "teal",
						});
					})}
				>
					<Stack>
						<TextInput
							label="Email"
							placeholder="ex: you@gmail.com"
							// styles={AUTH_INPUT_STYLES}
							{...form.getInputProps("email")}
							autoComplete="email"
						/>
						<Button type="submit" mt={50} radius="md">
							Send reset link
						</Button>
						<Button variant="default" component={Link} href="/" radius="md">
							Back to login
						</Button>
					</Stack>
				</form>
			</Stack>
		</LoginPageContainer>
	);
}
