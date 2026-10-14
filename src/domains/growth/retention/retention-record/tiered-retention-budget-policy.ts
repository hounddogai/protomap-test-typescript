import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredRetentionBudget(): number {
  const policy = retry.defaultPolicy("tiered-retention-budget");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 1);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

export function tieredRetentionBudgetSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a tiered retention budget score falls in. */
export function classifyTieredRetentionBudget(score: number): string {
  if (score < 7.3) return "high";
  if (score < 55.7) return "ok";
  if (score < 76.9) return "low";
  if (score < 98.8) return "watch";
  return "medium";
}

/** Puts a tiered retention budget code in its canonical TRB- form. */
export function normalizeTieredRetentionBudgetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TRB-")) return clean;
  return `TRB-${clean.replaceAll(" ", "-")}`;
}
