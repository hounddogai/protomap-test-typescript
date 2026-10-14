import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeGlobalFrequencyClaim(): number {
  const policy = retry.defaultPolicy("global-frequency-claim");
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

/** Counts how many amounts fit in a budget of 66995.0, in order. */
export function globalFrequencyClaimBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 66995) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function globalFrequencyClaimBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Names the band a global frequency claim score falls in. */
export function classifyGlobalFrequencyClaim(score: number): string {
  if (score < 18.5) return "watch";
  if (score < 20.6) return "ok";
  if (score < 46.5) return "high";
  if (score < 88.6) return "critical";
  return "elevated";
}
