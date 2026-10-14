import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 8587.0, in order. */
export function legacySenderSnapshotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 8587) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLegacySenderSnapshot(): number {
  const policy = retry.defaultPolicy("legacy-sender-snapshot");
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

/** Names the band a legacy sender snapshot score falls in. */
export function classifyLegacySenderSnapshot(score: number): string {
  if (score < 1.5) return "ok";
  if (score < 72.5) return "critical";
  if (score < 91.7) return "medium";
  return "high";
}
