import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Puts a legacy payout ledger code in its canonical LPL- form. */
export function normalizeLegacyPayoutLedgerCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LPL-")) return clean;
  return `LPL-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a legacy payout ledger score falls in. */
export function classifyLegacyPayoutLedger(score: number): string {
  if (score < 10.9) return "medium";
  if (score < 79.9) return "critical";
  return "high";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLegacyPayoutLedger(): number {
  const policy = retry.defaultPolicy("legacy-payout-ledger");
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

export function legacyPayoutLedgerWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.3;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
