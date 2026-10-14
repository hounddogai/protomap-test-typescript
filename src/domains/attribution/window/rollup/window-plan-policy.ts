/** Puts a window plan code in its canonical WP- form. */
export function normalizeWindowPlanCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WP-")) return clean;
  return `WP-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a window plan score falls in. */
export function classifyWindowPlan(score: number): string {
  if (score < 29.1) return "watch";
  if (score < 53.5) return "ok";
  return "minimal";
}
