import { PrimaryOptOutEntry } from "../entry/primary-opt-out-entry.js";
import { normalizeScheduledOptOutAllocationCode } from "../entry/scheduled-opt-out-allocation-policy.js";
import { AdaptiveOptOutQuota, newAdaptiveOptOutQuota } from "./adaptive-opt-out-quota.js";

export function summarizePrimaryOptOutEntriesForQuota(items: PrimaryOptOutEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveAdaptiveOptOutQuotasFromEntry(items: PrimaryOptOutEntry[]): AdaptiveOptOutQuota[] {
  const out: AdaptiveOptOutQuota[] = [];
  for (const item of items) {
    const derived = newAdaptiveOptOutQuota(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveAdaptiveOptOutQuota(item: AdaptiveOptOutQuota): string {
  return normalizeScheduledOptOutAllocationCode(item.code);
}
