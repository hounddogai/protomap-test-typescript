import { classifyRegionalDomainCycle } from "../../domain/digest/regional-domain-cycle-policy.js";
import { WeightedDomainDigest } from "../../domain/digest/weighted-domain-digest.js";
import { ScheduledWarmupRecord, newScheduledWarmupRecord } from "./scheduled-warmup-record.js";

export function summarizeWeightedDomainDigestsForRecord(items: WeightedDomainDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveScheduledWarmupRecordsFromDigest(items: WeightedDomainDigest[]): ScheduledWarmupRecord[] {
  const out: ScheduledWarmupRecord[] = [];
  for (const item of items) {
    const derived = newScheduledWarmupRecord(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeScheduledWarmupRecord(item: ScheduledWarmupRecord): string {
  return classifyRegionalDomainCycle(item.measuredValue());
}
