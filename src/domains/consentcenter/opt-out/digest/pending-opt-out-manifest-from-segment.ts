import { SeasonalSubscriptionSegment } from "../../subscription/agreement/seasonal-subscription-segment.js";
import { subscriptionAgreementWeight } from "../../subscription/agreement/subscription-agreement-policy.js";
import { PendingOptOutManifest, newPendingOptOutManifest } from "./pending-opt-out-manifest.js";

export function summarizeSeasonalSubscriptionSegmentsForManifest(items: SeasonalSubscriptionSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function derivePendingOptOutManifestsFromSegment(items: SeasonalSubscriptionSegment[]): PendingOptOutManifest[] {
  const out: PendingOptOutManifest[] = [];
  for (const item of items) {
    const derived = newPendingOptOutManifest(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function rankPendingOptOutManifest(item: PendingOptOutManifest): number {
  return subscriptionAgreementWeight(5, true);
}
