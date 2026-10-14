import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 50988.0, in order. */
export function weightedRewardForecastBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 50988) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function weightedRewardForecastWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.7;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a weighted reward forecast code in its canonical WRF- form. */
export function normalizeWeightedRewardForecastCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WRF-")) return clean;
  return `WRF-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWeightedRewardForecast(): number {
  const policy = retry.defaultPolicy("weighted-reward-forecast");
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
