import { RedemptionLedger } from "../score/redemption-ledger.js";
import { strictRedemptionScoreWeight } from "../score/strict-redemption-score-policy.js";
import { RedemptionAllocation, newRedemptionAllocation } from "./redemption-allocation.js";

export function summarizeRedemptionLedgersForAllocation(items: RedemptionLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveRedemptionAllocationsFromLedger(items: RedemptionLedger[]): RedemptionAllocation[] {
  const out: RedemptionAllocation[] = [];
  for (const item of items) {
    const derived = newRedemptionAllocation(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateRedemptionAllocation(item: RedemptionAllocation): number {
  return strictRedemptionScoreWeight(4, true);
}
