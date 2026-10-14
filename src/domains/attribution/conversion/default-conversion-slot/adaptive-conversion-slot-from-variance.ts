import {
  normalizeTieredTouchpointVarianceCode,
} from "../../touchpoint/touchpoint-window/tiered-touchpoint-variance-policy.js";
import { TieredTouchpointVariance } from "../../touchpoint/touchpoint-window/tiered-touchpoint-variance.js";
import { AdaptiveConversionSlot, newAdaptiveConversionSlot } from "./adaptive-conversion-slot.js";

export function summarizeTieredTouchpointVariancesForSlot(items: TieredTouchpointVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveAdaptiveConversionSlotsFromVariance(items: TieredTouchpointVariance[]): AdaptiveConversionSlot[] {
  const out: AdaptiveConversionSlot[] = [];
  for (const item of items) {
    const derived = newAdaptiveConversionSlot(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectAdaptiveConversionSlot(item: AdaptiveConversionSlot): string {
  return normalizeTieredTouchpointVarianceCode(item.code);
}
