import { normalizeLenientWarmupDraftCode } from "../../warmup/schedule/lenient-warmup-draft-policy.js";
import { WarmupSchedule } from "../../warmup/schedule/warmup-schedule.js";
import { AdaptiveDomainMetric, newAdaptiveDomainMetric } from "./adaptive-domain-metric.js";

export function summarizeWarmupSchedulesForMetric(items: WarmupSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveAdaptiveDomainMetricsFromSchedule(items: WarmupSchedule[]): AdaptiveDomainMetric[] {
  const out: AdaptiveDomainMetric[] = [];
  for (const item of items) {
    const derived = newAdaptiveDomainMetric(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveAdaptiveDomainMetric(item: AdaptiveDomainMetric): string {
  return normalizeLenientWarmupDraftCode(item.code);
}
