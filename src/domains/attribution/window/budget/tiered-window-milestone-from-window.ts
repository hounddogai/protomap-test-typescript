import { globalConversionWindowBucket } from "../../conversion/window/global-conversion-window-policy.js";
import { GlobalConversionWindow } from "../../conversion/window/global-conversion-window.js";
import { TieredWindowMilestone, newTieredWindowMilestone } from "./tiered-window-milestone.js";

export function summarizeGlobalConversionWindowsForMilestone(items: GlobalConversionWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveTieredWindowMilestonesFromWindow(items: GlobalConversionWindow[]): TieredWindowMilestone[] {
  const out: TieredWindowMilestone[] = [];
  for (const item of items) {
    const derived = newTieredWindowMilestone(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitTieredWindowMilestone(item: TieredWindowMilestone): string {
  return globalConversionWindowBucket(item.weightedLoad());
}
