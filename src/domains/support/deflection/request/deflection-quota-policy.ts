/** Puts a deflection quota code in its canonical DQ- form. */
export function normalizeDeflectionQuotaCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DQ-")) return clean;
  return `DQ-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a deflection quota score falls in. */
export function classifyDeflectionQuota(score: number): string {
  if (score < 43.5) return "elevated";
  if (score < 52.5) return "critical";
  return "low";
}

/** Counts how many amounts fit in a budget of 68759.0, in order. */
export function deflectionQuotaBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 68759) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
