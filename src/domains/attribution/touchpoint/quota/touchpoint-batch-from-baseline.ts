import { legacyWindowBaselineWeight } from "../../window/default-window-review/legacy-window-baseline-policy.js";
import { LegacyWindowBaseline } from "../../window/default-window-review/legacy-window-baseline.js";
import { TouchpointBatch, newTouchpointBatch } from "./touchpoint-batch.js";

export function summarizeLegacyWindowBaselinesForBatch(items: LegacyWindowBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveTouchpointBatchesFromBaseline(items: LegacyWindowBaseline[]): TouchpointBatch[] {
  const out: TouchpointBatch[] = [];
  for (const item of items) {
    const derived = newTouchpointBatch(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planTouchpointBatch(item: TouchpointBatch): number {
  return legacyWindowBaselineWeight(2, true);
}
