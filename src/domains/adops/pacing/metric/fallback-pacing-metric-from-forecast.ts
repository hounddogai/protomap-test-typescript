import { LenientPacingForecast } from "../pacing-forecast/lenient-pacing-forecast.js";
import { normalizePendingPacingTemplateCode } from "../pacing-forecast/pending-pacing-template-policy.js";
import { FallbackPacingMetric, newFallbackPacingMetric } from "./fallback-pacing-metric.js";

export function summarizeLenientPacingForecastsForMetric(items: LenientPacingForecast[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveFallbackPacingMetricsFromForecast(items: LenientPacingForecast[]): FallbackPacingMetric[] {
  const out: FallbackPacingMetric[] = [];
  for (const item of items) {
    const derived = newFallbackPacingMetric(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveFallbackPacingMetric(item: FallbackPacingMetric): string {
  return normalizePendingPacingTemplateCode(item.code);
}
