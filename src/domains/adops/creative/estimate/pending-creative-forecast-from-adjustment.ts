import { BidRuleAdjustment } from "../../bid-rule/slot/bid-rule-adjustment.js";
import { bidRuleClaimBucket } from "../../bid-rule/slot/bid-rule-claim-policy.js";
import { PendingCreativeForecast, newPendingCreativeForecast } from "./pending-creative-forecast.js";

export function summarizeBidRuleAdjustmentsForForecast(items: BidRuleAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function derivePendingCreativeForecastsFromAdjustment(items: BidRuleAdjustment[]): PendingCreativeForecast[] {
  const out: PendingCreativeForecast[] = [];
  for (const item of items) {
    const derived = newPendingCreativeForecast(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function planPendingCreativeForecast(item: PendingCreativeForecast): string {
  return bidRuleClaimBucket(item.weightedExposure());
}
