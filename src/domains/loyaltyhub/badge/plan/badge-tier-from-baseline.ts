import { badgeEntryBucket } from "../global-badge-digest/badge-entry-policy.js";
import { PrimaryBadgeBaseline } from "../global-badge-digest/primary-badge-baseline.js";
import { BadgeTier, newBadgeTier } from "./badge-tier.js";

export function summarizePrimaryBadgeBaselinesForTier(items: PrimaryBadgeBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveBadgeTiersFromBaseline(items: PrimaryBadgeBaseline[]): BadgeTier[] {
  const out: BadgeTier[] = [];
  for (const item of items) {
    const derived = newBadgeTier(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function splitBadgeTier(item: BadgeTier): string {
  return badgeEntryBucket(item.effectiveTotal());
}
