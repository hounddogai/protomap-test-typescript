import { CappedPreferenceEntry } from "../entry/capped-preference-entry.js";
import { preferenceEntryWeight } from "../entry/preference-entry-policy.js";
import { PrimaryPreferenceRequest, newPrimaryPreferenceRequest } from "./primary-preference-request.js";

export function summarizeCappedPreferenceEntriesForRequest(items: CappedPreferenceEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function derivePrimaryPreferenceRequestsFromEntry(items: CappedPreferenceEntry[]): PrimaryPreferenceRequest[] {
  const out: PrimaryPreferenceRequest[] = [];
  for (const item of items) {
    const derived = newPrimaryPreferenceRequest(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settlePrimaryPreferenceRequest(item: PrimaryPreferenceRequest): number {
  return preferenceEntryWeight(8, true);
}
