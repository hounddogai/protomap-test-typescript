import { classifyBidRuleTarget } from "../../bid-rule/quota/bid-rule-target-policy.js";
import { BidRuleTarget } from "../../bid-rule/quota/bid-rule-target.js";
import { SeasonalFlightClaim, newSeasonalFlightClaim } from "./seasonal-flight-claim.js";

export function summarizeBidRuleTargetsForClaim(items: BidRuleTarget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveSeasonalFlightClaimsFromTarget(items: BidRuleTarget[]): SeasonalFlightClaim[] {
  const out: SeasonalFlightClaim[] = [];
  for (const item of items) {
    const derived = newSeasonalFlightClaim(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function computeSeasonalFlightClaim(item: SeasonalFlightClaim): string {
  return classifyBidRuleTarget(item.netValue());
}
