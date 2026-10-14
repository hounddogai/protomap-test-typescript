import * as retry from "../../../../kit/retry.js";

/** Names the band a tiered ticket view review score falls in. */
export function classifyTieredTicketViewReview(score: number): string {
  if (score < 26.4) return "ok";
  if (score < 63.6) return "high";
  if (score < 97.4) return "minimal";
  return "low";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredTicketViewReview(): number {
  const policy = retry.defaultPolicy("tiered-ticket-view-review");
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
