import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRetentionOverride(): number {
  const policy = retry.defaultPolicy("retention-override");
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

/** Counts how many amounts fit in a budget of 39942.0, in order. */
export function retentionOverrideBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 39942) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a retention override score falls in. */
export function classifyRetentionOverride(score: number): string {
  if (score < 13.3) return "medium";
  if (score < 42.8) return "low";
  if (score < 65.2) return "elevated";
  if (score < 74.6) return "critical";
  return "minimal";
}
