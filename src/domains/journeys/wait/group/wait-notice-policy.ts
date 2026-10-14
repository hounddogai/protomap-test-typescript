import * as retry from "../../../../kit/retry.js";

/** Names the band a wait notice score falls in. */
export function classifyWaitNotice(score: number): string {
  if (score < 60.2) return "watch";
  if (score < 67.4) return "critical";
  return "medium";
}

/** Counts how many amounts fit in a budget of 14850.0, in order. */
export function waitNoticeBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 14850) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a wait notice code in its canonical WN- form. */
export function normalizeWaitNoticeCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WN-")) return clean;
  return `WN-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWaitNotice(): number {
  const policy = retry.defaultPolicy("wait-notice");
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
