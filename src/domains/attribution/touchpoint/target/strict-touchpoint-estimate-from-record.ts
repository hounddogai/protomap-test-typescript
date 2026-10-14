import {
  adaptiveConversionQuotaWeight,
} from "../../conversion/conversion-record/adaptive-conversion-quota-policy.js";
import { TieredConversionRecord } from "../../conversion/conversion-record/tiered-conversion-record.js";
import { StrictTouchpointEstimate, newStrictTouchpointEstimate } from "./strict-touchpoint-estimate.js";

export function summarizeTieredConversionRecordsForEstimate(items: TieredConversionRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveStrictTouchpointEstimatesFromRecord(items: TieredConversionRecord[]): StrictTouchpointEstimate[] {
  const out: StrictTouchpointEstimate[] = [];
  for (const item of items) {
    const derived = newStrictTouchpointEstimate(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceStrictTouchpointEstimate(item: StrictTouchpointEstimate): number {
  return adaptiveConversionQuotaWeight(6, true);
}
