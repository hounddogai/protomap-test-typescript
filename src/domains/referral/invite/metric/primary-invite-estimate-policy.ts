import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function primaryInviteEstimateSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

export function primaryInviteEstimateWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.65;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a primary invite estimate score falls in. */
export function classifyPrimaryInviteEstimate(score: number): string {
  if (score < 1.5) return "critical";
  if (score < 21.9) return "minimal";
  if (score < 75.7) return "medium";
  if (score < 79.3) return "elevated";
  return "high";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePrimaryInviteEstimate(): number {
  const policy = retry.defaultPolicy("primary-invite-estimate");
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
