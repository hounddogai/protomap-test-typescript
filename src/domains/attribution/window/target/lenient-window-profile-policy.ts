/** Names the band a lenient window profile score falls in. */
export function classifyLenientWindowProfile(score: number): string {
  if (score < 29.5) return "high";
  if (score < 61.2) return "ok";
  if (score < 75.3) return "watch";
  if (score < 87) return "medium";
  return "low";
}

/** Counts how many amounts fit in a budget of 98477.0, in order. */
export function lenientWindowProfileBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 98477) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a lenient window profile code in its canonical LWP- form. */
export function normalizeLenientWindowProfileCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LWP-")) return clean;
  return `LWP-${clean.replaceAll(" ", "-")}`;
}
