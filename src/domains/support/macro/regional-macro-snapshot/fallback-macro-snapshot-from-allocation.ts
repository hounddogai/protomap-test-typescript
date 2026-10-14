import { classifyMacroAllocation } from "../mapping/macro-allocation-policy.js";
import { MacroAllocation } from "../mapping/macro-allocation.js";
import { FallbackMacroSnapshot, newFallbackMacroSnapshot } from "./fallback-macro-snapshot.js";

export function summarizeMacroAllocationsForSnapshot(items: MacroAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveFallbackMacroSnapshotsFromAllocation(items: MacroAllocation[]): FallbackMacroSnapshot[] {
  const out: FallbackMacroSnapshot[] = [];
  for (const item of items) {
    const derived = newFallbackMacroSnapshot(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function computeFallbackMacroSnapshot(item: FallbackMacroSnapshot): string {
  return classifyMacroAllocation(item.weightedExposure());
}
