import { redemptionManifestBucket } from "../../redemption/bundle/redemption-manifest-policy.js";
import { RedemptionSlot } from "../../redemption/bundle/redemption-slot.js";
import { AdaptiveLevelNotice, newAdaptiveLevelNotice } from "./adaptive-level-notice.js";

export function summarizeRedemptionSlotsForNotice(items: RedemptionSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveAdaptiveLevelNoticesFromSlot(items: RedemptionSlot[]): AdaptiveLevelNotice[] {
  const out: AdaptiveLevelNotice[] = [];
  for (const item of items) {
    const derived = newAdaptiveLevelNotice(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeAdaptiveLevelNotice(item: AdaptiveLevelNotice): string {
  return redemptionManifestBucket(item.adjustedVolume());
}
