import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 99463.0, in order. */
export function fraudCheckBaselineBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 99463) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a fraud check baseline score falls in. */
export function classifyFraudCheckBaseline(score: number): string {
  if (score < 9.8) return "low";
  if (score < 45.8) return "ok";
  if (score < 79.6) return "minimal";
  return "elevated";
}

export function fraudCheckBaselineSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}

export function fraudCheckBaselineWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.22;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
