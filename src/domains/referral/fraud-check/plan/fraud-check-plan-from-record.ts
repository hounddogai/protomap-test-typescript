import { payoutQuotaBucket } from "../../payout/record-item/payout-quota-policy.js";
import { PrimaryPayoutRecord } from "../../payout/record-item/primary-payout-record.js";
import { FraudCheckPlan, newFraudCheckPlan } from "./fraud-check-plan.js";

export function summarizePrimaryPayoutRecordsForPlan(items: PrimaryPayoutRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveFraudCheckPlansFromRecord(items: PrimaryPayoutRecord[]): FraudCheckPlan[] {
  const out: FraudCheckPlan[] = [];
  for (const item of items) {
    const derived = newFraudCheckPlan(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function splitFraudCheckPlan(item: FraudCheckPlan): string {
  return payoutQuotaBucket(item.adjustedTotal());
}
