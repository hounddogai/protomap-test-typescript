import { LenientPacingSegment } from "../../pacing/segment/lenient-pacing-segment.js";
import { pacingBatchBucket } from "../../pacing/segment/pacing-batch-policy.js";
import { AdaptiveCreativeForecast, newAdaptiveCreativeForecast } from "./adaptive-creative-forecast.js";

export function summarizeLenientPacingSegmentsForForecast(items: LenientPacingSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveAdaptiveCreativeForecastsFromSegment(items: LenientPacingSegment[]): AdaptiveCreativeForecast[] {
  const out: AdaptiveCreativeForecast[] = [];
  for (const item of items) {
    const derived = newAdaptiveCreativeForecast(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function splitAdaptiveCreativeForecast(item: AdaptiveCreativeForecast): string {
  return pacingBatchBucket(item.projectedValue());
}
