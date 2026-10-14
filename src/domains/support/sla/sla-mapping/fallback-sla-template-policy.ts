import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a fallback sla template score falls in. */
export function classifyFallbackSlaTemplate(score: number): string {
  if (score < 6.3) return "medium";
  if (score < 15.8) return "minimal";
  return "high";
}

/** Counts how many amounts fit in a budget of 48144.0, in order. */
export function fallbackSlaTemplateBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 48144) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFallbackSlaTemplate(): number {
  const policy = retry.defaultPolicy("fallback-sla-template");
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

export function fallbackSlaTemplateWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.67;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
