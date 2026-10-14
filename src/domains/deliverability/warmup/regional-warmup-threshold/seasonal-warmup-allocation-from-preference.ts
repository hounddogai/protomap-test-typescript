import { domainPreferenceBucket } from "../../domain/proposal/domain-preference-policy.js";
import { DomainPreference } from "../../domain/proposal/domain-preference.js";
import { SeasonalWarmupAllocation, newSeasonalWarmupAllocation } from "./seasonal-warmup-allocation.js";

export function summarizeDomainPreferencesForAllocation(items: DomainPreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveSeasonalWarmupAllocationsFromPreference(items: DomainPreference[]): SeasonalWarmupAllocation[] {
  const out: SeasonalWarmupAllocation[] = [];
  for (const item of items) {
    const derived = newSeasonalWarmupAllocation(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planSeasonalWarmupAllocation(item: SeasonalWarmupAllocation): string {
  return domainPreferenceBucket(item.adjustedValue());
}
