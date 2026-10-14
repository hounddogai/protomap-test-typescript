import { globalCreativeSummaryWeight } from "../summary/global-creative-summary-policy.js";
import { GlobalCreativeSummary } from "../summary/global-creative-summary.js";
import { ManualCreativeLedger, newManualCreativeLedger } from "./manual-creative-ledger.js";

export function summarizeGlobalCreativeSummariesForLedger(items: GlobalCreativeSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveManualCreativeLedgersFromSummary(items: GlobalCreativeSummary[]): ManualCreativeLedger[] {
  const out: ManualCreativeLedger[] = [];
  for (const item of items) {
    const derived = newManualCreativeLedger(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planManualCreativeLedger(item: ManualCreativeLedger): number {
  return globalCreativeSummaryWeight(3, true);
}
