import { ManualPlacementEntry } from "../../placement/entry/manual-placement-entry.js";
import { placementVarianceBucket } from "../../placement/entry/placement-variance-policy.js";
import { ScheduledPacingTarget, newScheduledPacingTarget } from "./scheduled-pacing-target.js";

export function summarizeManualPlacementEntriesForTarget(items: ManualPlacementEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveScheduledPacingTargetsFromEntry(items: ManualPlacementEntry[]): ScheduledPacingTarget[] {
  const out: ScheduledPacingTarget[] = [];
  for (const item of items) {
    const derived = newScheduledPacingTarget(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function rankScheduledPacingTarget(item: ScheduledPacingTarget): string {
  return placementVarianceBucket(item.effectiveVolume());
}
