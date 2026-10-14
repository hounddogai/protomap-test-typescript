import { cappedRetentionAllocationWeight } from "../../retention/threshold/capped-retention-allocation-policy.js";
import { CappedRetentionAllocation } from "../../retention/threshold/capped-retention-allocation.js";
import { SeasonalActivationWindow, newSeasonalActivationWindow } from "./seasonal-activation-window.js";

export function summarizeCappedRetentionAllocationsForWindow(items: CappedRetentionAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveSeasonalActivationWindowsFromAllocation(items: CappedRetentionAllocation[]): SeasonalActivationWindow[] {
  const out: SeasonalActivationWindow[] = [];
  for (const item of items) {
    const derived = newSeasonalActivationWindow(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifySeasonalActivationWindowExtra(item: SeasonalActivationWindow): number {
  return cappedRetentionAllocationWeight(3, true);
}
