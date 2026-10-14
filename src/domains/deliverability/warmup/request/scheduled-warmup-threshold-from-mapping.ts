import { normalizeWarmupAuditCode } from "../mapping/warmup-audit-policy.js";
import { WeightedWarmupMapping } from "../mapping/weighted-warmup-mapping.js";
import { ScheduledWarmupThreshold, newScheduledWarmupThreshold } from "./scheduled-warmup-threshold.js";

export function summarizeWeightedWarmupMappingsForThreshold(items: WeightedWarmupMapping[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveScheduledWarmupThresholdsFromMapping(items: WeightedWarmupMapping[]): ScheduledWarmupThreshold[] {
  const out: ScheduledWarmupThreshold[] = [];
  for (const item of items) {
    const derived = newScheduledWarmupThreshold(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeScheduledWarmupThreshold(item: ScheduledWarmupThreshold): string {
  return normalizeWarmupAuditCode(item.code);
}
