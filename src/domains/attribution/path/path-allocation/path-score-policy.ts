import * as retry from "../../../../kit/retry.js";

/** Names the band a path score score falls in. */
export function classifyPathScore(score: number): string {
  if (score < 43) return "high";
  if (score < 80.3) return "watch";
  if (score < 88.2) return "medium";
  if (score < 90) return "ok";
  return "low";
}

/** Counts how many amounts fit in a budget of 62002.0, in order. */
export function pathScoreBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 62002) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePathScore(): number {
  const policy = retry.defaultPolicy("path-score");
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
