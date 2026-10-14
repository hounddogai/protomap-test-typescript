import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function pacingEstimateBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Counts how many amounts fit in a budget of 28382.0, in order. */
export function pacingEstimateBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 28382) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a pacing estimate score falls in. */
export function classifyPacingEstimate(score: number): string {
  if (score < 40.3) return "low";
  if (score < 45.4) return "minimal";
  if (score < 69.2) return "watch";
  if (score < 70.5) return "medium";
  return "elevated";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePacingEstimate(): number {
  const policy = retry.defaultPolicy("pacing-estimate");
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
