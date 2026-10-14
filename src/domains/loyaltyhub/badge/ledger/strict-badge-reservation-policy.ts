/** Puts a strict badge reservation code in its canonical SBR- form. */
export function normalizeStrictBadgeReservationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SBR-")) return clean;
  return `SBR-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a strict badge reservation score falls in. */
export function classifyStrictBadgeReservation(score: number): string {
  if (score < 55.1) return "medium";
  if (score < 58.2) return "ok";
  return "critical";
}
