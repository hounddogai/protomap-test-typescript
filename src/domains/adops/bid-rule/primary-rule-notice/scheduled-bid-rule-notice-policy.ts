import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function scheduledBidRuleNoticeWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.2;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeScheduledBidRuleNotice(): number {
  const policy = retry.defaultPolicy("scheduled-bid-rule-notice");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 3);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Counts how many amounts fit in a budget of 10481.0, in order. */
export function scheduledBidRuleNoticeBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 10481) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a scheduled bid rule notice code in its canonical SBRN- form. */
export function normalizeScheduledBidRuleNoticeCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SBRN-")) return clean;
  return `SBRN-${clean.replaceAll(" ", "-")}`;
}
