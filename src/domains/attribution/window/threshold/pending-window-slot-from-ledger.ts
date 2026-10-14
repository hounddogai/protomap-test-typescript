import { pathBudgetWeight } from "../../path/estimate/path-budget-policy.js";
import { PathLedger } from "../../path/estimate/path-ledger.js";
import { PendingWindowSlot, newPendingWindowSlot } from "./pending-window-slot.js";

export function summarizePathLedgersForSlot(items: PathLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function derivePendingWindowSlotsFromLedger(items: PathLedger[]): PendingWindowSlot[] {
  const out: PendingWindowSlot[] = [];
  for (const item of items) {
    const derived = newPendingWindowSlot(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function allocatePendingWindowSlot(item: PendingWindowSlot): number {
  return pathBudgetWeight(7, true);
}
