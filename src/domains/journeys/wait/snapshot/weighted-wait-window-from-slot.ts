import { normalizeBranchAuditCode } from "../../branch/slot/branch-audit-policy.js";
import { BranchSlot } from "../../branch/slot/branch-slot.js";
import { WeightedWaitWindow, newWeightedWaitWindow } from "./weighted-wait-window.js";

export function summarizeBranchSlotsForWindow(items: BranchSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveWeightedWaitWindowsFromSlot(items: BranchSlot[]): WeightedWaitWindow[] {
  const out: WeightedWaitWindow[] = [];
  for (const item of items) {
    const derived = newWeightedWaitWindow(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function planWeightedWaitWindow(item: WeightedWaitWindow): string {
  return normalizeBranchAuditCode(item.code);
}
