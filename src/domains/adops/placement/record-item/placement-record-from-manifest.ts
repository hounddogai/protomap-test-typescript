import { FallbackFrequencyManifest } from "../../frequency/frequency-snapshot/fallback-frequency-manifest.js";
import { lenientFrequencyRecordWeight } from "../../frequency/frequency-snapshot/lenient-frequency-record-policy.js";
import { PlacementRecord, newPlacementRecord } from "./placement-record.js";

export function summarizeFallbackFrequencyManifestsForRecord(items: FallbackFrequencyManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function derivePlacementRecordsFromManifest(items: FallbackFrequencyManifest[]): PlacementRecord[] {
  const out: PlacementRecord[] = [];
  for (const item of items) {
    const derived = newPlacementRecord(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizePlacementRecord(item: PlacementRecord): number {
  return lenientFrequencyRecordWeight(5, true);
}
