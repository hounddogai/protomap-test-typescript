import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 93289.0, in order. */
export function tieredStreakSummaryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 93289) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredStreakSummary(): number {
  const policy = retry.defaultPolicy("tiered-streak-summary");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 2);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Names the band a tiered streak summary score falls in. */
export function classifyTieredStreakSummary(score: number): string {
  if (score < 5.7) return "medium";
  if (score < 47.1) return "minimal";
  return "watch";
}

/** Puts a tiered streak summary code in its canonical TSS- form. */
export function normalizeTieredStreakSummaryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TSS-")) return clean;
  return `TSS-${clean.replaceAll(" ", "-")}`;
}
