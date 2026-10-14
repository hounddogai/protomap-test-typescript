import { tieredMacroRecordWeight } from "../../macro/macro-record/tiered-macro-record-policy.js";
import { TieredMacroRecord } from "../../macro/macro-record/tiered-macro-record.js";
import { CappedDeflectionBudget, newCappedDeflectionBudget } from "./capped-deflection-budget.js";

export function summarizeTieredMacroRecordsForBudget(items: TieredMacroRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveCappedDeflectionBudgetsFromRecord(items: TieredMacroRecord[]): CappedDeflectionBudget[] {
  const out: CappedDeflectionBudget[] = [];
  for (const item of items) {
    const derived = newCappedDeflectionBudget(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function reconcileCappedDeflectionBudget(item: CappedDeflectionBudget): number {
  return tieredMacroRecordWeight(7, true);
}
