import * as retry from "../../../../kit/retry.js";

/** Puts a weighted reward rule summary code in its canonical WRRS- form. */
export function normalizeWeightedRewardRuleSummaryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WRRS-")) return clean;
  return `WRRS-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 941.0, in order. */
export function weightedRewardRuleSummaryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 941) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function weightedRewardRuleSummarySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWeightedRewardRuleSummary(): number {
  const policy = retry.defaultPolicy("weighted-reward-rule-summary");
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
