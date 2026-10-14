import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 63868.0, in order. */
export function escalationReservationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 63868) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a escalation reservation code in its canonical ER- form. */
export function normalizeEscalationReservationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ER-")) return clean;
  return `ER-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a escalation reservation score falls in. */
export function classifyEscalationReservation(score: number): string {
  if (score < 65.5) return "critical";
  if (score < 92.3) return "low";
  if (score < 92.9) return "minimal";
  return "ok";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeEscalationReservation(): number {
  const policy = retry.defaultPolicy("escalation-reservation");
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
