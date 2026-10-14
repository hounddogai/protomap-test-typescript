import { placementRecordWeight } from "../../placement/record-item/placement-record-policy.js";
import { PlacementRecord } from "../../placement/record-item/placement-record.js";
import { FallbackCreativeWindow, newFallbackCreativeWindow } from "./fallback-creative-window.js";

export function summarizePlacementRecordsForWindow(items: PlacementRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveFallbackCreativeWindowsFromRecord(items: PlacementRecord[]): FallbackCreativeWindow[] {
  const out: FallbackCreativeWindow[] = [];
  for (const item of items) {
    const derived = newFallbackCreativeWindow(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function splitFallbackCreativeWindow(item: FallbackCreativeWindow): number {
  return placementRecordWeight(5, true);
}
