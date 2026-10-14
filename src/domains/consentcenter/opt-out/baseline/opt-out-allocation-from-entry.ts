import { classifyPreferenceEntry } from "../../preference/entry/preference-entry-policy.js";
import { PreferenceEntry } from "../../preference/entry/preference-entry.js";
import { OptOutAllocation, newOptOutAllocation } from "./opt-out-allocation.js";

export function summarizePreferenceEntriesForAllocation(items: PreferenceEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveOptOutAllocationsFromEntry(items: PreferenceEntry[]): OptOutAllocation[] {
  const out: OptOutAllocation[] = [];
  for (const item of items) {
    const derived = newOptOutAllocation(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignOptOutAllocation(item: OptOutAllocation): string {
  return classifyPreferenceEntry(item.measuredValue());
}
