import * as retry from "../../../../kit/retry.js";

/** Puts a placement score code in its canonical PS- form. */
export function normalizePlacementScoreCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PS-")) return clean;
  return `PS-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePlacementScore(): number {
  const policy = retry.defaultPolicy("placement-score");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 5);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Counts how many amounts fit in a budget of 22804.0, in order. */
export function placementScoreBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 22804) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
