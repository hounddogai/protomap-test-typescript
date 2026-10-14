import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function globalJourneySnapshotBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeGlobalJourneySnapshot(): number {
  const policy = retry.defaultPolicy("global-journey-snapshot");
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

/** Counts how many amounts fit in a budget of 39417.0, in order. */
export function globalJourneySnapshotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 39417) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function globalJourneySnapshotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.77;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
