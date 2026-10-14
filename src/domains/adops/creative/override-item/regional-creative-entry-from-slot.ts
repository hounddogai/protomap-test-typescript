import { AdaptivePlacementSlot } from "../../placement/slot/adaptive-placement-slot.js";
import { pendingPlacementPlanBucket } from "../../placement/slot/pending-placement-plan-policy.js";
import { RegionalCreativeEntry, newRegionalCreativeEntry } from "./regional-creative-entry.js";

export function summarizeAdaptivePlacementSlotsForEntry(items: AdaptivePlacementSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveRegionalCreativeEntriesFromSlot(items: AdaptivePlacementSlot[]): RegionalCreativeEntry[] {
  const out: RegionalCreativeEntry[] = [];
  for (const item of items) {
    const derived = newRegionalCreativeEntry(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function reconcileRegionalCreativeEntry(item: RegionalCreativeEntry): string {
  return pendingPlacementPlanBucket(item.adjustedExposure());
}
