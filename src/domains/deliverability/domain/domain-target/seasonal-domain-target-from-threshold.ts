import { SeasonalWarmupThreshold } from "../../warmup/mapping/seasonal-warmup-threshold.js";
import { classifyWarmupAudit } from "../../warmup/mapping/warmup-audit-policy.js";
import { SeasonalDomainTarget, newSeasonalDomainTarget } from "./seasonal-domain-target.js";

export function summarizeSeasonalWarmupThresholdsForTarget(items: SeasonalWarmupThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveSeasonalDomainTargetsFromThreshold(items: SeasonalWarmupThreshold[]): SeasonalDomainTarget[] {
  const out: SeasonalDomainTarget[] = [];
  for (const item of items) {
    const derived = newSeasonalDomainTarget(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateSeasonalDomainTarget(item: SeasonalDomainTarget): string {
  return classifyWarmupAudit(item.measuredValue());
}
