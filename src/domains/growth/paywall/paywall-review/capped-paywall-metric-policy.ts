export function cappedPaywallMetricSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

/** Counts how many amounts fit in a budget of 92722.0, in order. */
export function cappedPaywallMetricBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 92722) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a capped paywall metric score falls in. */
export function classifyCappedPaywallMetric(score: number): string {
  if (score < 32.7) return "minimal";
  if (score < 48.6) return "watch";
  return "high";
}

/** Puts a capped paywall metric code in its canonical CPM- form. */
export function normalizeCappedPaywallMetricCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CPM-")) return clean;
  return `CPM-${clean.replaceAll(" ", "-")}`;
}
