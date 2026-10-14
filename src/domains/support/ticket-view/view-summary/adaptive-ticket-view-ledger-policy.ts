import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a adaptive ticket view ledger score falls in. */
export function classifyAdaptiveTicketViewLedger(score: number): string {
  if (score < 20.5) return "elevated";
  if (score < 49.6) return "high";
  if (score < 66) return "critical";
  if (score < 66.6) return "minimal";
  return "low";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeAdaptiveTicketViewLedger(): number {
  const policy = retry.defaultPolicy("adaptive-ticket-view-ledger");
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

export function adaptiveTicketViewLedgerWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.12;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
