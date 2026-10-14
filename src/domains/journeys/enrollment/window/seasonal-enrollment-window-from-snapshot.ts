import { normalizeTieredEnrollmentSnapshotCode } from "../snapshot/tiered-enrollment-snapshot-policy.js";
import { TieredEnrollmentSnapshot } from "../snapshot/tiered-enrollment-snapshot.js";
import { SeasonalEnrollmentWindow, newSeasonalEnrollmentWindow } from "./seasonal-enrollment-window.js";

export function summarizeTieredEnrollmentSnapshotsForWindow(items: TieredEnrollmentSnapshot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveSeasonalEnrollmentWindowsFromSnapshot(items: TieredEnrollmentSnapshot[]): SeasonalEnrollmentWindow[] {
  const out: SeasonalEnrollmentWindow[] = [];
  for (const item of items) {
    const derived = newSeasonalEnrollmentWindow(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifySeasonalEnrollmentWindow(item: SeasonalEnrollmentWindow): string {
  return normalizeTieredEnrollmentSnapshotCode(item.code);
}
