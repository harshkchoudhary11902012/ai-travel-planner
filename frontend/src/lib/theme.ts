import {
  ActionIcon,
  Button,
  Title,
  createTheme,
} from "@mantine/core";

/**
 * Same structure as `harsh/PCSOFTWARES/thp-v4/src/theme.ts` (`createTheme`, colors,
 * component extensions) with fixed values — thp-v4’s compact defaults (sm buttons,
 * sm action icons, 14px tabs). Body/heading fonts from `app/layout.tsx` CSS vars.
 */
export const theme = createTheme({
  colors: {
    mainColor: [
      "#209F9E",
      "#209F9E",
      "#209F9E",
      "#209F9E",
      "#209F9E",
      "#209F9E",
      "#209F9E",
      "#209F9E",
      "#209F9E",
      "#209F9E",
    ],
  },
  primaryColor: "mainColor",
  primaryShade: { light: 6, dark: 8 },
  defaultRadius: "md",

  fontFamily:
    "var(--font-poppins), Poppins, ui-sans-serif, system-ui, sans-serif",
  fontFamilyMonospace:
    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",

  headings: {
    fontFamily:
      "var(--font-space-grotesk), 'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
    fontWeight: "700",
  },

  defaultGradient: {
    from: "#0d9488",
    to: "#06b6d4",
    deg: 120,
  },

  components: {
    Button: Button.extend({
      defaultProps: {
        radius: "xl",
        size: "sm",
      },
    }),
    ActionIcon: ActionIcon.extend({
      defaultProps: {
        size: "sm",
        variant: "light",
      },
    }),
    Tabs: {
      styles: {
        tab: {
          fontSize: "14px",
          fontWeight: 500,
        },
      },
    },
    Title: Title.extend({
      styles: {
        root: {
          fontFamily:
            'var(--font-space-grotesk), "Space Grotesk", ui-sans-serif, system-ui, sans-serif',
        },
      },
    }),
  },
});

export default theme;
