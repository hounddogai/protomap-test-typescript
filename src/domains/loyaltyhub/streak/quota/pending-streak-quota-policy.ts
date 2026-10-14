import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 12394.0, in order. */
export function pendingStreakQuotaBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 12394) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergePendingStreakQuotaLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a pending streak quota code in its canonical PSQ- form. */
export function normalizePendingStreakQuotaCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PSQ-")) return clean;
  return `PSQ-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePendingStreakQuota(): number {
  const policy = retry.defaultPolicy("pending-streak-quota");
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
