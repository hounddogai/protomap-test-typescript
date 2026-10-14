import * as retry from "../../../../kit/retry.js";

/** Puts a mention window code in its canonical MW- form. */
export function normalizeMentionWindowCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MW-")) return clean;
  return `MW-${clean.replaceAll(" ", "-")}`;
}

export function mentionWindowSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

/** Counts how many amounts fit in a budget of 94608.0, in order. */
export function mentionWindowBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 94608) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeMentionWindow(): number {
  const policy = retry.defaultPolicy("mention-window");
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
