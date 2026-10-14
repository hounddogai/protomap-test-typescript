import * as retry from "../../../../kit/retry.js";

/** Names the band a primary frequency manifest score falls in. */
export function classifyPrimaryFrequencyManifest(score: number): string {
  if (score < 23.5) return "critical";
  if (score < 58.6) return "elevated";
  if (score < 70.1) return "low";
  return "high";
}

/** Counts how many amounts fit in a budget of 19080.0, in order. */
export function primaryFrequencyManifestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 19080) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePrimaryFrequencyManifest(): number {
  const policy = retry.defaultPolicy("primary-frequency-manifest");
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
