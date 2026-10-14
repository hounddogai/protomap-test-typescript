import { doubleOptInBundleWeight } from "../../double-opt-in/bundle/double-opt-in-bundle-policy.js";
import { RegionalDoubleOptInRecord } from "../../double-opt-in/bundle/regional-double-opt-in-record.js";
import { DefaultSuppressionSlot, newDefaultSuppressionSlot } from "./default-suppression-slot.js";

export function summarizeRegionalDoubleOptInRecordsForSlot(items: RegionalDoubleOptInRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveDefaultSuppressionSlotsFromRecord(items: RegionalDoubleOptInRecord[]): DefaultSuppressionSlot[] {
  const out: DefaultSuppressionSlot[] = [];
  for (const item of items) {
    const derived = newDefaultSuppressionSlot(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizeDefaultSuppressionSlot(item: DefaultSuppressionSlot): number {
  return doubleOptInBundleWeight(1, true);
}
