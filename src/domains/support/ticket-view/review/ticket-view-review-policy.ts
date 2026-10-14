import * as retry from "../../../../kit/retry.js";

/** Names the band a ticket view review score falls in. */
export function classifyTicketViewReview(score: number): string {
  if (score < 6.5) return "minimal";
  if (score < 29.4) return "watch";
  if (score < 95.4) return "ok";
  return "elevated";
}

export function ticketViewReviewSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTicketViewReview(): number {
  const policy = retry.defaultPolicy("ticket-view-review");
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
