"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Anchor,
  Button,
  Checkbox,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
  Alert,
  SimpleGrid,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";

import { AuthSocialButtons } from "@/components/Auth/AuthSocialButtons";
import { AuthSplitLayout } from "@/components/Auth/AuthSplitLayout";
import { authFieldStyles } from "@/components/Auth/authFieldStyles";
import { login, signup } from "@/lib/auth";
import { AuthTransitionOverlay } from "@/components/Auth/AuthTransitionOverlay";
import authPage from "@/components/Auth/authPage.module.css";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [remember, setRemember] = useState(false);
  const [transitionMessage, setTransitionMessage] = useState<string | null>(null);

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
      {transitionMessage ? <AuthTransitionOverlay message={transitionMessage} /> : null}
      <AuthSplitLayout backHref="/" progressFilled={3}>
      <Stack gap="xl" maw={480} w="100%" miw={0}>
        <div>
          <Title
            order={1}
            fw={800}
            fz="clamp(1.65rem, 4vw, 2.15rem)"
            lh={1.2}
            className={authPage.pageTitle}
          >
            Create your account
          </Title>
          <Text size="md" mt="sm" maw={420} className={authPage.subtitle}>
            Join AI Travel Planner and start building itineraries effortlessly—it&apos;s free.
          </Text>
        </div>

        {error ? (
          <Alert color="red" title="Sign up failed" variant="light" radius="md">
            {error}
          </Alert>
        ) : null}

        <form
          onSubmit={form.onSubmit(async (values) => {
            setError(null);
            try {
              // API currently accepts email + password only; names are for UX until the backend stores them.
              setTransitionMessage("Creating your account…");
              await signup({ email: values.email, password: values.password });
              setTransitionMessage("Signing you in…");
              await login({ email: values.email, password: values.password });
              showNotification({
                title: "Successfully signed in",
                message: "Your account is ready. Opening your dashboard.",
                color: "teal",
              });
              setTransitionMessage("Opening your dashboard…");
              await new Promise((r) => setTimeout(r, 2000));
              router.replace("/dashboard");
            } catch (e) {
              setTransitionMessage(null);
              setError(e instanceof Error ? e.message : "Sign up failed");
            }
          })}
        >
          <Stack gap="lg">
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <TextInput
                label="First name"
                placeholder="Enter your first name"
                styles={authFieldStyles}
                {...form.getInputProps("firstName")}
                autoComplete="given-name"
              />
              <TextInput
                label="Last name"
                placeholder="Enter your last name"
                styles={authFieldStyles}
                {...form.getInputProps("lastName")}
                autoComplete="family-name"
              />
            </SimpleGrid>
            <TextInput
              label="Email"
              placeholder="ex: you@gmail.com"
              styles={authFieldStyles}
              {...form.getInputProps("email")}
              autoComplete="email"
            />
            <PasswordInput
              label="Password"
              placeholder="Create a strong password"
              styles={authFieldStyles}
              {...form.getInputProps("password")}
              autoComplete="new-password"
            />

            <Checkbox
              label="Remember me"
              checked={remember}
              onChange={(e) => setRemember(e.currentTarget.checked)}
              size="sm"
              styles={{ label: { fontSize: 13, fontWeight: 500, color: "#475569" } }}
            />

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
              Create account
            </Button>
          </Stack>
        </form>

        <Text ta="center" size="sm" c="dimmed">
          Already have an account?{" "}
          <Anchor component={Link} href="/" fw={700} c="teal.8">
            Log in
          </Anchor>
        </Text>

        <AuthSocialButtons />
      </Stack>
    </AuthSplitLayout>
    </>
  );
}
