import * as retry from "../../../../kit/retry.js";

/** Names the band a ticket view preference score falls in. */
export function classifyTicketViewPreference(score: number): string {
  if (score < 19.1) return "elevated";
  if (score < 92) return "low";
  return "high";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTicketViewPreference(): number {
  const policy = retry.defaultPolicy("ticket-view-preference");
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

/** Counts how many amounts fit in a budget of 93337.0, in order. */
export function ticketViewPreferenceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 93337) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
