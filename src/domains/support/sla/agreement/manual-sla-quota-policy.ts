import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a manual sla quota score falls in. */
export function classifyManualSlaQuota(score: number): string {
  if (score < 12.4) return "high";
  if (score < 30.9) return "medium";
  if (score < 54.2) return "critical";
  if (score < 55.1) return "watch";
  return "elevated";
}

export function manualSlaQuotaWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.75;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 4383.0, in order. */
export function manualSlaQuotaBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 4383) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeManualSlaQuota(): number {
  const policy = retry.defaultPolicy("manual-sla-quota");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 2);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
