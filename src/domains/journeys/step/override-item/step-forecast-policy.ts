import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a step forecast score falls in. */
export function classifyStepForecast(score: number): string {
  if (score < 50.2) return "ok";
  if (score < 60.5) return "high";
  if (score < 89.7) return "low";
  return "critical";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStepForecast(): number {
  const policy = retry.defaultPolicy("step-forecast");
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

/** Counts how many amounts fit in a budget of 11121.0, in order. */
export function stepForecastBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 11121) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function stepForecastWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.62;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
