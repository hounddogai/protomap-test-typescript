import { normalizeCreativeRecordCode } from "../../creative/override-item/creative-record-policy.js";
import { RegionalCreativeEntry } from "../../creative/override-item/regional-creative-entry.js";
import { CappedPacingEstimate, newCappedPacingEstimate } from "./capped-pacing-estimate.js";

export function summarizeRegionalCreativeEntriesForEstimate(items: RegionalCreativeEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveCappedPacingEstimatesFromEntry(items: RegionalCreativeEntry[]): CappedPacingEstimate[] {
  const out: CappedPacingEstimate[] = [];
  for (const item of items) {
    const derived = newCappedPacingEstimate(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateCappedPacingEstimate(item: CappedPacingEstimate): string {
  return normalizeCreativeRecordCode(item.code);
}
