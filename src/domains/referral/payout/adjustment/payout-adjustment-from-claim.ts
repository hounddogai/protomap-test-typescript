import {
  classifyDefaultFraudCheckPlan,
} from "../../fraud-check/primary-check-claim/default-fraud-check-plan-policy.js";
import { LegacyFraudCheckClaim } from "../../fraud-check/primary-check-claim/legacy-fraud-check-claim.js";
import { PayoutAdjustment, newPayoutAdjustment } from "./payout-adjustment.js";

export function summarizeLegacyFraudCheckClaimsForAdjustment(items: LegacyFraudCheckClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function derivePayoutAdjustmentsFromClaim(items: LegacyFraudCheckClaim[]): PayoutAdjustment[] {
  const out: PayoutAdjustment[] = [];
  for (const item of items) {
    const derived = newPayoutAdjustment(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifyPayoutAdjustment(item: PayoutAdjustment): string {
  return classifyDefaultFraudCheckPlan(item.measuredValue());
}
