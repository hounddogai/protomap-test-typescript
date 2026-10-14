import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 54230.0, in order. */
export function pacingClaimBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 54230) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a pacing claim score falls in. */
export function classifyPacingClaim(score: number): string {
  if (score < 41.3) return "ok";
  if (score < 64.4) return "elevated";
  if (score < 96) return "minimal";
  return "watch";
}

export function pacingClaimWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.7;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePacingClaim(): number {
  const policy = retry.defaultPolicy("pacing-claim");
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
