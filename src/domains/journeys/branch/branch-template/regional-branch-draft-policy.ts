import * as retry from "../../../../kit/retry.js";

/** Puts a regional branch draft code in its canonical RBD- form. */
export function normalizeRegionalBranchDraftCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RBD-")) return clean;
  return `RBD-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRegionalBranchDraft(): number {
  const policy = retry.defaultPolicy("regional-branch-draft");
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

/** Counts how many amounts fit in a budget of 14556.0, in order. */
export function regionalBranchDraftBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 14556) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
