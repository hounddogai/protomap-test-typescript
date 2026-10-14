import * as retry from "../../../../kit/retry.js";

/** Names the band a tiered funnel rule score falls in. */
export function classifyTieredFunnelRule(score: number): string {
  if (score < 26.5) return "ok";
  if (score < 60.8) return "elevated";
  return "high";
}

/** Counts how many amounts fit in a budget of 45768.0, in order. */
export function tieredFunnelRuleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 45768) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredFunnelRule(): number {
  const policy = retry.defaultPolicy("tiered-funnel-rule");
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
