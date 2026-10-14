import { normalizeFallbackOptOutBatchCode } from "../../opt-out/milestone/fallback-opt-out-batch-policy.js";
import { LegacyOptOutSegment } from "../../opt-out/milestone/legacy-opt-out-segment.js";
import { AdaptiveDoubleOptInException, newAdaptiveDoubleOptInException } from "./adaptive-double-opt-in-exception.js";

export function summarizeLegacyOptOutSegmentsForException(items: LegacyOptOutSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveAdaptiveDoubleOptInExceptionsFromSegment(items: LegacyOptOutSegment[]): AdaptiveDoubleOptInException[] {
  const out: AdaptiveDoubleOptInException[] = [];
  for (const item of items) {
    const derived = newAdaptiveDoubleOptInException(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveAdaptiveDoubleOptInException(item: AdaptiveDoubleOptInException): string {
  return normalizeFallbackOptOutBatchCode(item.code);
}
