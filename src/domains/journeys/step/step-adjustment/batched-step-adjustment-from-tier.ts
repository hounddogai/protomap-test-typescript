import {
  classifyRegionalEnrollmentSnapshot,
} from "../../enrollment/agreement/regional-enrollment-snapshot-policy.js";
import { TieredEnrollmentTier } from "../../enrollment/agreement/tiered-enrollment-tier.js";
import { BatchedStepAdjustment, newBatchedStepAdjustment } from "./batched-step-adjustment.js";

export function summarizeTieredEnrollmentTiersForAdjustment(items: TieredEnrollmentTier[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveBatchedStepAdjustmentsFromTier(items: TieredEnrollmentTier[]): BatchedStepAdjustment[] {
  const out: BatchedStepAdjustment[] = [];
  for (const item of items) {
    const derived = newBatchedStepAdjustment(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveBatchedStepAdjustment(item: BatchedStepAdjustment): string {
  return classifyRegionalEnrollmentSnapshot(item.effectiveValue());
}
