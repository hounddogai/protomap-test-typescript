import { CappedConversionBundle } from "../../conversion/ledger/capped-conversion-bundle.js";
import { conversionLedgerWeight } from "../../conversion/ledger/conversion-ledger-policy.js";
import { RollingTouchpointTemplate, newRollingTouchpointTemplate } from "./rolling-touchpoint-template.js";

export function summarizeCappedConversionBundlesForTemplate(items: CappedConversionBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveRollingTouchpointTemplatesFromBundle(items: CappedConversionBundle[]): RollingTouchpointTemplate[] {
  const out: RollingTouchpointTemplate[] = [];
  for (const item of items) {
    const derived = newRollingTouchpointTemplate(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitRollingTouchpointTemplate(item: RollingTouchpointTemplate): number {
  return conversionLedgerWeight(9, true);
}
