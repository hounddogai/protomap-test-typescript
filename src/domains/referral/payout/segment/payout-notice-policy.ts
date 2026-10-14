import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probePayoutNotice(): number {
  const policy = retry.defaultPolicy("payout-notice");
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

/** Puts a payout notice code in its canonical PN- form. */
export function normalizePayoutNoticeCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PN-")) return clean;
  return `PN-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 82586.0, in order. */
export function payoutNoticeBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 82586) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
