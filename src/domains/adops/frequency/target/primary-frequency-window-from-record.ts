import { DefaultFrequencyRecord } from "../digest/default-frequency-record.js";
import { globalFrequencyAllocationBucket } from "../digest/global-frequency-allocation-policy.js";
import { PrimaryFrequencyWindow, newPrimaryFrequencyWindow } from "./primary-frequency-window.js";

export function summarizeDefaultFrequencyRecordsForWindow(items: DefaultFrequencyRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function derivePrimaryFrequencyWindowsFromRecord(items: DefaultFrequencyRecord[]): PrimaryFrequencyWindow[] {
  const out: PrimaryFrequencyWindow[] = [];
  for (const item of items) {
    const derived = newPrimaryFrequencyWindow(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function scorePrimaryFrequencyWindow(item: PrimaryFrequencyWindow): string {
  return globalFrequencyAllocationBucket(item.effectiveLoad());
}
