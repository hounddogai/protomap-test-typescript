import * as retry from "../../../../kit/retry.js";

/** Puts a pending creative draft code in its canonical PCD- form. */
export function normalizePendingCreativeDraftCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PCD-")) return clean;
  return `PCD-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePendingCreativeDraft(): number {
  const policy = retry.defaultPolicy("pending-creative-draft");
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

/** Counts how many amounts fit in a budget of 72875.0, in order. */
export function pendingCreativeDraftBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 72875) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
