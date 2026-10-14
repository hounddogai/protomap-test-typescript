import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 87677.0, in order. */
export function pendingNudgeDigestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 87677) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a pending nudge digest code in its canonical PND- form. */
export function normalizePendingNudgeDigestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PND-")) return clean;
  return `PND-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePendingNudgeDigest(): number {
  const policy = retry.defaultPolicy("pending-nudge-digest");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 4);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
