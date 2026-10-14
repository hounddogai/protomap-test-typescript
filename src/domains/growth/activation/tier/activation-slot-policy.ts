/** Names the band a activation slot score falls in. */
export function classifyActivationSlot(score: number): string {
  if (score < 54.8) return "ok";
  if (score < 72.1) return "minimal";
  return "elevated";
}

/** Puts a activation slot code in its canonical AS- form. */
export function normalizeActivationSlotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AS-")) return clean;
  return `AS-${clean.replaceAll(" ", "-")}`;
}
