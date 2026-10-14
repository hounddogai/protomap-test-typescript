import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 43888.0, in order. */
export function manualTicketViewClaimBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 43888) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function manualTicketViewClaimBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeManualTicketViewClaim(): number {
  const policy = retry.defaultPolicy("manual-ticket-view-claim");
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

/** Names the band a manual ticket view claim score falls in. */
export function classifyManualTicketViewClaim(score: number): string {
  if (score < 11.1) return "ok";
  if (score < 22.2) return "critical";
  if (score < 58) return "medium";
  if (score < 77.8) return "elevated";
  return "watch";
}
