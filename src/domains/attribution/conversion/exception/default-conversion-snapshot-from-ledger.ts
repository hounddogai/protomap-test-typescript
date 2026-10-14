import { fallbackCreditBudgetWeight } from "../../credit/credit-reservation/fallback-credit-budget-policy.js";
import { ManualCreditLedger } from "../../credit/credit-reservation/manual-credit-ledger.js";
import { DefaultConversionSnapshot, newDefaultConversionSnapshot } from "./default-conversion-snapshot.js";

export function summarizeManualCreditLedgersForSnapshot(items: ManualCreditLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveDefaultConversionSnapshotsFromLedger(items: ManualCreditLedger[]): DefaultConversionSnapshot[] {
  const out: DefaultConversionSnapshot[] = [];
  for (const item of items) {
    const derived = newDefaultConversionSnapshot(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifyDefaultConversionSnapshot(item: DefaultConversionSnapshot): number {
  return fallbackCreditBudgetWeight(4, true);
}
