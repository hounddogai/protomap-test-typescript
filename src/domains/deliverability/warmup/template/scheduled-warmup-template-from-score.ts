import { AdaptiveDomainScore } from "../../domain/metric/adaptive-domain-score.js";
import { domainProfileBucket } from "../../domain/metric/domain-profile-policy.js";
import { ScheduledWarmupTemplate, newScheduledWarmupTemplate } from "./scheduled-warmup-template.js";

export function summarizeAdaptiveDomainScoresForTemplate(items: AdaptiveDomainScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveScheduledWarmupTemplatesFromScore(items: AdaptiveDomainScore[]): ScheduledWarmupTemplate[] {
  const out: ScheduledWarmupTemplate[] = [];
  for (const item of items) {
    const derived = newScheduledWarmupTemplate(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function applyScheduledWarmupTemplate(item: ScheduledWarmupTemplate): string {
  return domainProfileBucket(item.netLoad());
}
