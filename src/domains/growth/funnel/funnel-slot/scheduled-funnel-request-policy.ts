import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 87956.0, in order. */
export function scheduledFunnelRequestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 87956) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function scheduledFunnelRequestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.4;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeScheduledFunnelRequest(): number {
  const policy = retry.defaultPolicy("scheduled-funnel-request");
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

/** Names the band a scheduled funnel request score falls in. */
export function classifyScheduledFunnelRequest(score: number): string {
  if (score < 5.7) return "low";
  if (score < 9.2) return "ok";
  if (score < 15.6) return "high";
  if (score < 50.3) return "elevated";
  return "medium";
}
