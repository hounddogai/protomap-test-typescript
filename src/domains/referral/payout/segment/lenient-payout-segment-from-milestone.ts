import { tierEntryBucket } from "../../tier/entry/tier-entry-policy.js";
import { TierMilestone } from "../../tier/entry/tier-milestone.js";
import { LenientPayoutSegment, newLenientPayoutSegment } from "./lenient-payout-segment.js";

export function summarizeTierMilestonesForSegment(items: TierMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveLenientPayoutSegmentsFromMilestone(items: TierMilestone[]): LenientPayoutSegment[] {
  const out: LenientPayoutSegment[] = [];
  for (const item of items) {
    const derived = newLenientPayoutSegment(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreLenientPayoutSegment(item: LenientPayoutSegment): string {
  return tierEntryBucket(item.adjustedVolume());
}
