/** Names the band a activation metric score falls in. */
export function classifyActivationMetric(score: number): string {
  if (score < 29.4) return "critical";
  if (score < 45.1) return "elevated";
  if (score < 51.5) return "ok";
  if (score < 81) return "minimal";
  return "watch";
}

export function activationMetricSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}

/** Puts a activation metric code in its canonical AM- form. */
export function normalizeActivationMetricCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AM-")) return clean;
  return `AM-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 11947.0, in order. */
export function activationMetricBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 11947) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
