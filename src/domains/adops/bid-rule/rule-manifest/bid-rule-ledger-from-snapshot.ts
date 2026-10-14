import { FallbackFlightSnapshot } from "../../flight/rule/fallback-flight-snapshot.js";
import { globalFlightGroupWeight } from "../../flight/rule/global-flight-group-policy.js";
import { BidRuleLedger, newBidRuleLedger } from "./bid-rule-ledger.js";

export function summarizeFallbackFlightSnapshotsForLedger(items: FallbackFlightSnapshot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveBidRuleLedgersFromSnapshot(items: FallbackFlightSnapshot[]): BidRuleLedger[] {
  const out: BidRuleLedger[] = [];
  for (const item of items) {
    const derived = newBidRuleLedger(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planBidRuleLedger(item: BidRuleLedger): number {
  return globalFlightGroupWeight(1, true);
}
