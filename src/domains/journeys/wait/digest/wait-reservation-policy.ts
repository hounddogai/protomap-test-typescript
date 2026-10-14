/** Names the band a wait reservation score falls in. */
export function classifyWaitReservation(score: number): string {
  if (score < 8.2) return "high";
  if (score < 35.9) return "ok";
  if (score < 45.8) return "minimal";
  if (score < 76.6) return "critical";
  return "watch";
}

/** Puts a wait reservation code in its canonical WR- form. */
export function normalizeWaitReservationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WR-")) return clean;
  return `WR-${clean.replaceAll(" ", "-")}`;
}
