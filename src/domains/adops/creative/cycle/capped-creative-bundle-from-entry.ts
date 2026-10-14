import { ManualPlacementEntry } from "../../placement/entry/manual-placement-entry.js";
import { placementVarianceWeight } from "../../placement/entry/placement-variance-policy.js";
import { CappedCreativeBundle, newCappedCreativeBundle } from "./capped-creative-bundle.js";

export function summarizeManualPlacementEntriesForBundle(items: ManualPlacementEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveCappedCreativeBundlesFromEntry(items: ManualPlacementEntry[]): CappedCreativeBundle[] {
  const out: CappedCreativeBundle[] = [];
  for (const item of items) {
    const derived = newCappedCreativeBundle(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateCappedCreativeBundle(item: CappedCreativeBundle): number {
  return placementVarianceWeight(1, true);
}
