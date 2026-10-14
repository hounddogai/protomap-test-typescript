import { manualNudgeOverrideBucket } from "../../nudge/preference/manual-nudge-override-policy.js";
import { NudgeRequest } from "../../nudge/preference/nudge-request.js";
import { RegionalFunnelReview, newRegionalFunnelReview } from "./regional-funnel-review.js";

export function summarizeNudgeRequestsForReview(items: NudgeRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveRegionalFunnelReviewsFromRequest(items: NudgeRequest[]): RegionalFunnelReview[] {
  const out: RegionalFunnelReview[] = [];
  for (const item of items) {
    const derived = newRegionalFunnelReview(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function computeRegionalFunnelReview(item: RegionalFunnelReview): string {
  return manualNudgeOverrideBucket(item.measuredValue());
}
