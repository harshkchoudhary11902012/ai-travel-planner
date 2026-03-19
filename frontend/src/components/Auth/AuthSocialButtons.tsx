"use client";

import { Button, Group } from "@mantine/core";
import { IconBrandApple, IconBrandGoogle } from "@tabler/icons-react";
import { showNotification } from "@mantine/notifications";

import styles from "./AuthSplitLayout.module.css";

export function AuthSocialButtons() {
  const comingSoon = () =>
    showNotification({
      title: "Coming soon",
      message: "Social sign-in isn’t wired up yet—use email and password for now.",
      color: "gray",
    });

  return (
    <>
      <div className={styles.divider}>
        <span>Or</span>
      </div>
      <Group grow gap="md" wrap="wrap">
        <Button
          variant="default"
          className={styles.socialBtn}
          leftSection={<IconBrandGoogle size={18} />}
          onClick={comingSoon}
          size="md"
        >
          Continue with Google
        </Button>
        <Button
          className={`${styles.socialBtn} ${styles.socialApple}`}
          leftSection={<IconBrandApple size={18} />}
          onClick={comingSoon}
          size="md"
        >
          Continue with Apple
        </Button>
      </Group>
    </>
  );
}
