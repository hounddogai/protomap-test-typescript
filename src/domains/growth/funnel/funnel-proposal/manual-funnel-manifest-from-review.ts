import { activationNoticeWeight } from "../../activation/capped-activation-review/activation-notice-policy.js";
import { SeasonalActivationReview } from "../../activation/capped-activation-review/seasonal-activation-review.js";
import { ManualFunnelManifest, newManualFunnelManifest } from "./manual-funnel-manifest.js";

export function summarizeSeasonalActivationReviewsForManifest(items: SeasonalActivationReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveManualFunnelManifestsFromReview(items: SeasonalActivationReview[]): ManualFunnelManifest[] {
  const out: ManualFunnelManifest[] = [];
  for (const item of items) {
    const derived = newManualFunnelManifest(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function splitManualFunnelManifest(item: ManualFunnelManifest): number {
  return activationNoticeWeight(1, true);
}
