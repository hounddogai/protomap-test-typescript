import { adaptiveBounceAdjustmentBucket } from "../../bounce/summary/adaptive-bounce-adjustment-policy.js";
import { AdaptiveBounceAdjustment } from "../../bounce/summary/adaptive-bounce-adjustment.js";
import { ComplaintAgreement, newComplaintAgreement } from "./complaint-agreement.js";

export function summarizeAdaptiveBounceAdjustmentsForAgreement(items: AdaptiveBounceAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveComplaintAgreementsFromAdjustment(items: AdaptiveBounceAdjustment[]): ComplaintAgreement[] {
  const out: ComplaintAgreement[] = [];
  for (const item of items) {
    const derived = newComplaintAgreement(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergeComplaintAgreement(item: ComplaintAgreement): string {
  return adaptiveBounceAdjustmentBucket(item.netValue());
}
