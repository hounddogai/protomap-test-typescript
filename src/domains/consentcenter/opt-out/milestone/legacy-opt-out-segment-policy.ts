import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLegacyOptOutSegment(): number {
  const policy = retry.defaultPolicy("legacy-opt-out-segment");
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

/** Names the band a legacy opt out segment score falls in. */
export function classifyLegacyOptOutSegment(score: number): string {
  if (score < 7.7) return "minimal";
  if (score < 16.5) return "watch";
  if (score < 30.5) return "ok";
  return "medium";
}

/** Counts how many amounts fit in a budget of 17169.0, in order. */
export function legacyOptOutSegmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 17169) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
