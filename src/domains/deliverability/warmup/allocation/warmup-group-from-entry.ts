import { CappedDomainEntry } from "../../domain/mapping/capped-domain-entry.js";
import { cappedDomainMappingWeight } from "../../domain/mapping/capped-domain-mapping-policy.js";
import { WarmupGroup, newWarmupGroup } from "./warmup-group.js";

export function summarizeCappedDomainEntriesForGroup(items: CappedDomainEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveWarmupGroupsFromEntry(items: CappedDomainEntry[]): WarmupGroup[] {
  const out: WarmupGroup[] = [];
  for (const item of items) {
    const derived = newWarmupGroup(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function splitWarmupGroup(item: WarmupGroup): number {
  return cappedDomainMappingWeight(4, true);
}
