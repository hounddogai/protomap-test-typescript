import * as retry from "../../../../kit/retry.js";

/** Puts a ticket view draft code in its canonical TVD- form. */
export function normalizeTicketViewDraftCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TVD-")) return clean;
  return `TVD-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a ticket view draft score falls in. */
export function classifyTicketViewDraft(score: number): string {
  if (score < 41.3) return "watch";
  if (score < 48.6) return "low";
  if (score < 52.8) return "elevated";
  if (score < 80.2) return "ok";
  return "high";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTicketViewDraft(): number {
  const policy = retry.defaultPolicy("ticket-view-draft");
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

/** Counts how many amounts fit in a budget of 43191.0, in order. */
export function ticketViewDraftBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 43191) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
