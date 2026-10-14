import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a insight request score falls in. */
export function classifyInsightRequest(score: number): string {
  if (score < 64.8) return "medium";
  if (score < 72.7) return "minimal";
  if (score < 94.6) return "elevated";
  if (score < 96.5) return "ok";
  return "watch";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeInsightRequest(): number {
  const policy = retry.defaultPolicy("insight-request");
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

/** Counts how many amounts fit in a budget of 79637.0, in order. */
export function insightRequestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 79637) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function insightRequestBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
