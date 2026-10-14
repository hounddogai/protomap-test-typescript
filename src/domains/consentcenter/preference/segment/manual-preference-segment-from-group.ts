import { PendingSubscriptionGroup } from "../../subscription/subscription-allocation/pending-subscription-group.js";
import {
  pendingSubscriptionManifestBucket,
} from "../../subscription/subscription-allocation/pending-subscription-manifest-policy.js";
import { ManualPreferenceSegment, newManualPreferenceSegment } from "./manual-preference-segment.js";

export function summarizePendingSubscriptionGroupsForSegment(items: PendingSubscriptionGroup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveManualPreferenceSegmentsFromGroup(items: PendingSubscriptionGroup[]): ManualPreferenceSegment[] {
  const out: ManualPreferenceSegment[] = [];
  for (const item of items) {
    const derived = newManualPreferenceSegment(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizeManualPreferenceSegment(item: ManualPreferenceSegment): string {
  return pendingSubscriptionManifestBucket(item.netTotal());
}
