import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a journey draft score falls in. */
export function classifyJourneyDraft(score: number): string {
  if (score < 18.6) return "elevated";
  if (score < 42.4) return "ok";
  if (score < 48.3) return "critical";
  if (score < 98.9) return "high";
  return "medium";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeJourneyDraft(): number {
  const policy = retry.defaultPolicy("journey-draft");
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

export function journeyDraftWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.27;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
