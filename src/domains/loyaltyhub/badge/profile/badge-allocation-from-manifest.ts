import { BadgeManifest } from "../notice/badge-manifest.js";
import { badgeNoticeBucket } from "../notice/badge-notice-policy.js";
import { BadgeAllocation, newBadgeAllocation } from "./badge-allocation.js";

export function summarizeBadgeManifestsForAllocation(items: BadgeManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveBadgeAllocationsFromManifest(items: BadgeManifest[]): BadgeAllocation[] {
  const out: BadgeAllocation[] = [];
  for (const item of items) {
    const derived = newBadgeAllocation(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileBadgeAllocation(item: BadgeAllocation): string {
  return badgeNoticeBucket(item.measuredValue());
}
