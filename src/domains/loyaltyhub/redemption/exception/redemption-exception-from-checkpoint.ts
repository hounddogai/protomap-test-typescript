import { StreakCheckpoint } from "../../streak/agreement/streak-checkpoint.js";
import { normalizeStreakLedgerCode } from "../../streak/agreement/streak-ledger-policy.js";
import { RedemptionException, newRedemptionException } from "./redemption-exception.js";

export function summarizeStreakCheckpointsForException(items: StreakCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveRedemptionExceptionsFromCheckpoint(items: StreakCheckpoint[]): RedemptionException[] {
  const out: RedemptionException[] = [];
  for (const item of items) {
    const derived = newRedemptionException(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeRedemptionException(item: RedemptionException): string {
  return normalizeStreakLedgerCode(item.code);
}
