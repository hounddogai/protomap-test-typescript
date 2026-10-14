import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 30545.0, in order. */
export function exitRuleForecastBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 30545) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeExitRuleForecast(): number {
  const policy = retry.defaultPolicy("exit-rule-forecast");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 5);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Names the band a exit rule forecast score falls in. */
export function classifyExitRuleForecast(score: number): string {
  if (score < 8.9) return "watch";
  if (score < 73.3) return "high";
  if (score < 85.6) return "critical";
  return "medium";
}
