import { PacingProfile } from "../../pacing/segment/pacing-profile.js";
import { normalizePacingSegmentCode } from "../../pacing/segment/pacing-segment-policy.js";
import { BidRuleQuota, newBidRuleQuota } from "./bid-rule-quota.js";

export function summarizePacingProfilesForQuota(items: PacingProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveBidRuleQuotasFromProfile(items: PacingProfile[]): BidRuleQuota[] {
  const out: BidRuleQuota[] = [];
  for (const item of items) {
    const derived = newBidRuleQuota(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function assignBidRuleQuota(item: BidRuleQuota): string {
  return normalizePacingSegmentCode(item.code);
}
