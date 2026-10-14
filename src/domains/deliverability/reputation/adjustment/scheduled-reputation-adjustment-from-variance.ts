import {
  adaptiveComplaintMappingBucket,
} from "../../complaint/complaint-mapping/adaptive-complaint-mapping-policy.js";
import { GlobalComplaintVariance } from "../../complaint/complaint-mapping/global-complaint-variance.js";
import {
  ScheduledReputationAdjustment,
  newScheduledReputationAdjustment,
} from "./scheduled-reputation-adjustment.js";

export function summarizeGlobalComplaintVariancesForAdjustment(items: GlobalComplaintVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveScheduledReputationAdjustmentsFromVariance(items: GlobalComplaintVariance[]): ScheduledReputationAdjustment[] {
  const out: ScheduledReputationAdjustment[] = [];
  for (const item of items) {
    const derived = newScheduledReputationAdjustment(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergeScheduledReputationAdjustment(item: ScheduledReputationAdjustment): string {
  return adaptiveComplaintMappingBucket(item.measuredValue());
}
