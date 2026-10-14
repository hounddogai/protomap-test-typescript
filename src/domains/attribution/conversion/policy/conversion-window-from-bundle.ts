import { CappedConversionBundle } from "../ledger/capped-conversion-bundle.js";
import { classifyConversionLedger } from "../ledger/conversion-ledger-policy.js";
import { ConversionWindow, newConversionWindow } from "./conversion-window.js";

export function summarizeCappedConversionBundlesForWindow(items: CappedConversionBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveConversionWindowsFromBundle(items: CappedConversionBundle[]): ConversionWindow[] {
  const out: ConversionWindow[] = [];
  for (const item of items) {
    const derived = newConversionWindow(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settleConversionWindow(item: ConversionWindow): string {
  return classifyConversionLedger(item.adjustedLoad());
}
