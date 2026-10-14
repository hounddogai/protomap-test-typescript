import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 20321.0, in order. */
export function primaryTicketViewCheckpointBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 20321) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a primary ticket view checkpoint score falls in. */
export function classifyPrimaryTicketViewCheckpoint(score: number): string {
  if (score < 31.6) return "elevated";
  if (score < 42.9) return "critical";
  if (score < 50.2) return "watch";
  if (score < 54.8) return "medium";
  return "low";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePrimaryTicketViewCheckpoint(): number {
  const policy = retry.defaultPolicy("primary-ticket-view-checkpoint");
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

/** Puts a primary ticket view checkpoint code in its canonical PTVC- form. */
export function normalizePrimaryTicketViewCheckpointCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PTVC-")) return clean;
  return `PTVC-${clean.replaceAll(" ", "-")}`;
}
