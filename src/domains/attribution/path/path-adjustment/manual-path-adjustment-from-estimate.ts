import { strictTouchpointEstimateBucket } from "../../touchpoint/target/strict-touchpoint-estimate-policy.js";
import { StrictTouchpointEstimate } from "../../touchpoint/target/strict-touchpoint-estimate.js";
import { ManualPathAdjustment, newManualPathAdjustment } from "./manual-path-adjustment.js";

export function summarizeStrictTouchpointEstimatesForAdjustment(items: StrictTouchpointEstimate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveManualPathAdjustmentsFromEstimate(items: StrictTouchpointEstimate[]): ManualPathAdjustment[] {
  const out: ManualPathAdjustment[] = [];
  for (const item of items) {
    const derived = newManualPathAdjustment(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settleManualPathAdjustment(item: ManualPathAdjustment): string {
  return strictTouchpointEstimateBucket(item.netValue());
}
