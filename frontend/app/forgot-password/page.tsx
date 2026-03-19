"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Alert,
  Anchor,
  Button,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";

import { AuthSplitLayout } from "@/components/Auth/AuthSplitLayout";
import { authFieldStyles } from "@/components/Auth/authFieldStyles";
import authPage from "@/components/Auth/authPage.module.css";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  const form = useForm({
    initialValues: { email: "" },
    validate: {
      email: (value) =>
        /^\S+@\S+$/.test(value.trim()) ? null : "Enter a valid email",
    },
  });

  return (
    <AuthSplitLayout backHref="/" progressFilled={1}>
      <Stack gap="xl" maw={480} w="100%" miw={0}>
        <div>
          <Title
            order={1}
            fw={800}
            fz="clamp(1.65rem, 4vw, 2.15rem)"
            lh={1.2}
            className={authPage.pageTitle}
          >
            Forgot password?
          </Title>
          <Text size="md" mt="sm" maw={420} className={authPage.subtitle}>
            Enter the email you used to register. When email reset is enabled on the server,
            you&apos;ll receive a link to choose a new password.
          </Text>
        </div>

        {submitted ? (
          <Alert color="teal" title="Request recorded" variant="light" radius="md">
            If an account exists for that address, you&apos;ll get instructions once the backend
            sends mail.{" "}
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
          <Stack gap="lg">
            <TextInput
              label="Email"
              placeholder="ex: you@gmail.com"
              styles={authFieldStyles}
              {...form.getInputProps("email")}
              autoComplete="email"
            />
            <Button
              type="submit"
              fullWidth
              size="lg"
              radius="md"
              color="teal"
              styles={{
                root: {
                  fontWeight: 700,
                  letterSpacing: "0.03em",
                  boxShadow: "0 10px 28px rgba(15, 118, 110, 0.32)",
                },
              }}
            >
              Send reset link
            </Button>
            <Button variant="default" component={Link} href="/" fullWidth radius="md" size="md">
              Back to login
            </Button>
          </Stack>
        </form>
      </Stack>
    </AuthSplitLayout>
  );
}
