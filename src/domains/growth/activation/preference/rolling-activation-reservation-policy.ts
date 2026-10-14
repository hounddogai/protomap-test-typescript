/** Puts a rolling activation reservation code in its canonical RAR- form. */
export function normalizeRollingActivationReservationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RAR-")) return clean;
  return `RAR-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a rolling activation reservation score falls in. */
export function classifyRollingActivationReservation(score: number): string {
  if (score < 51) return "critical";
  if (score < 52.2) return "low";
  return "ok";
}
