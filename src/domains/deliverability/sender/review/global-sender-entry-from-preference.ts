import { adaptiveBounceGroupWeight } from "../../bounce/metric/adaptive-bounce-group-policy.js";
import { WeightedBouncePreference } from "../../bounce/metric/weighted-bounce-preference.js";
import { GlobalSenderEntry, newGlobalSenderEntry } from "./global-sender-entry.js";

export function summarizeWeightedBouncePreferencesForEntry(items: WeightedBouncePreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveGlobalSenderEntriesFromPreference(items: WeightedBouncePreference[]): GlobalSenderEntry[] {
  const out: GlobalSenderEntry[] = [];
  for (const item of items) {
    const derived = newGlobalSenderEntry(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeGlobalSenderEntry(item: GlobalSenderEntry): number {
  return adaptiveBounceGroupWeight(7, true);
}
