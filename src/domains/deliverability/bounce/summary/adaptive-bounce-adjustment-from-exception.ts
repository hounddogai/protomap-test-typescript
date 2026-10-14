import {
  normalizeWeightedReputationExceptionCode,
} from "../../reputation/reputation-exception/weighted-reputation-exception-policy.js";
import { WeightedReputationException } from "../../reputation/reputation-exception/weighted-reputation-exception.js";
import { AdaptiveBounceAdjustment, newAdaptiveBounceAdjustment } from "./adaptive-bounce-adjustment.js";

export function summarizeWeightedReputationExceptionsForAdjustment(items: WeightedReputationException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveAdaptiveBounceAdjustmentsFromException(items: WeightedReputationException[]): AdaptiveBounceAdjustment[] {
  const out: AdaptiveBounceAdjustment[] = [];
  for (const item of items) {
    const derived = newAdaptiveBounceAdjustment(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergeAdaptiveBounceAdjustment(item: AdaptiveBounceAdjustment): string {
  return normalizeWeightedReputationExceptionCode(item.code);
}
