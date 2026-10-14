import * as retry from "../../../../kit/retry.js";

export function senderAuditSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a sender audit score falls in. */
export function classifySenderAudit(score: number): string {
  if (score < 30.9) return "critical";
  if (score < 32.3) return "high";
  if (score < 85.5) return "minimal";
  return "ok";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSenderAudit(): number {
  const policy = retry.defaultPolicy("sender-audit");
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

/** Counts how many amounts fit in a budget of 46418.0, in order. */
export function senderAuditBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 46418) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
