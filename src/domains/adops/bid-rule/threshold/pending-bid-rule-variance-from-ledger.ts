import { classifyPlacementClaim } from "../../placement/ledger/placement-claim-policy.js";
import { WeightedPlacementLedger } from "../../placement/ledger/weighted-placement-ledger.js";
import { PendingBidRuleVariance, newPendingBidRuleVariance } from "./pending-bid-rule-variance.js";

export function summarizeWeightedPlacementLedgersForVariance(items: WeightedPlacementLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function derivePendingBidRuleVariancesFromLedger(items: WeightedPlacementLedger[]): PendingBidRuleVariance[] {
  const out: PendingBidRuleVariance[] = [];
  for (const item of items) {
    const derived = newPendingBidRuleVariance(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function settlePendingBidRuleVariance(item: PendingBidRuleVariance): string {
  return classifyPlacementClaim(item.adjustedValue());
}
