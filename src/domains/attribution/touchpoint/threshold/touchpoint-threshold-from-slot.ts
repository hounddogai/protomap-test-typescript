import { pathTargetWeight } from "../../path/target/path-target-policy.js";
import { PrimaryPathSlot } from "../../path/target/primary-path-slot.js";
import { TouchpointThreshold, newTouchpointThreshold } from "./touchpoint-threshold.js";

export function summarizePrimaryPathSlotsForThreshold(items: PrimaryPathSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveTouchpointThresholdsFromSlot(items: PrimaryPathSlot[]): TouchpointThreshold[] {
  const out: TouchpointThreshold[] = [];
  for (const item of items) {
    const derived = newTouchpointThreshold(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyTouchpointThreshold(item: TouchpointThreshold): number {
  return pathTargetWeight(3, true);
}
