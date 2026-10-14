import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 71970.0, in order. */
export function strictPaywallSnapshotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 71970) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a strict paywall snapshot score falls in. */
export function classifyStrictPaywallSnapshot(score: number): string {
  if (score < 34.8) return "high";
  if (score < 39.4) return "elevated";
  if (score < 49.3) return "ok";
  return "watch";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStrictPaywallSnapshot(): number {
  const policy = retry.defaultPolicy("strict-paywall-snapshot");
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

export function strictPaywallSnapshotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}
