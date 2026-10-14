import {
  rollingSubscriptionSummaryWeight,
} from "../../subscription/milestone/rolling-subscription-summary-policy.js";
import { RollingSubscriptionSummary } from "../../subscription/milestone/rolling-subscription-summary.js";
import { SeasonalDoubleOptInSlot, newSeasonalDoubleOptInSlot } from "./seasonal-double-opt-in-slot.js";

export function summarizeRollingSubscriptionSummariesForSlot(items: RollingSubscriptionSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveSeasonalDoubleOptInSlotsFromSummary(items: RollingSubscriptionSummary[]): SeasonalDoubleOptInSlot[] {
  const out: SeasonalDoubleOptInSlot[] = [];
  for (const item of items) {
    const derived = newSeasonalDoubleOptInSlot(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeSeasonalDoubleOptInSlot(item: SeasonalDoubleOptInSlot): number {
  return rollingSubscriptionSummaryWeight(4, true);
}
