/** Shared Mantine field look — matches premium auth mockups */
export const authFieldStyles = {
  label: {
    fontWeight: 600,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "#64748b",
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    fontSize: 15,
    minHeight: 46,
    border: "1px solid #e2e8f0",
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
  },
} as const;
