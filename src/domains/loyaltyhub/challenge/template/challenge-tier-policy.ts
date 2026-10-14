import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeChallengeTier(): number {
  const policy = retry.defaultPolicy("challenge-tier");
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

/** Names the band a challenge tier score falls in. */
export function classifyChallengeTier(score: number): string {
  if (score < 45.3) return "critical";
  if (score < 53.5) return "high";
  if (score < 72.2) return "elevated";
  if (score < 73.1) return "ok";
  return "low";
}

/** Counts how many amounts fit in a budget of 35471.0, in order. */
export function challengeTierBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 35471) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
