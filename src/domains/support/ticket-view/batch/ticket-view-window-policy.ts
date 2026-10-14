import * as retry from "../../../../kit/retry.js";

/** Names the band a ticket view window score falls in. */
export function classifyTicketViewWindow(score: number): string {
  if (score < 3.5) return "ok";
  if (score < 16.2) return "watch";
  if (score < 64.6) return "critical";
  return "low";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTicketViewWindow(): number {
  const policy = retry.defaultPolicy("ticket-view-window");
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

export function ticketViewWindowSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

/** Counts how many amounts fit in a budget of 41550.0, in order. */
export function ticketViewWindowBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 41550) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
