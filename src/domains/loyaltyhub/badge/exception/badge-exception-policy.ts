import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 73441.0, in order. */
export function badgeExceptionBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 73441) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a badge exception code in its canonical BE- form. */
export function normalizeBadgeExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BE-")) return clean;
  return `BE-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a badge exception score falls in. */
export function classifyBadgeException(score: number): string {
  if (score < 46) return "medium";
  if (score < 55) return "elevated";
  if (score < 76.9) return "critical";
  if (score < 97.9) return "high";
  return "minimal";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBadgeException(): number {
  const policy = retry.defaultPolicy("badge-exception");
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
