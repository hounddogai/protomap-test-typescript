import { classifyFraudCheckBudget } from "../../fraud-check/checkpoint/fraud-check-budget-policy.js";
import { PrimaryFraudCheckAssignment } from "../../fraud-check/checkpoint/primary-fraud-check-assignment.js";
import { TierBatch, newTierBatch } from "./tier-batch.js";

export function summarizePrimaryFraudCheckAssignmentsForBatch(items: PrimaryFraudCheckAssignment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveTierBatchesFromAssignment(items: PrimaryFraudCheckAssignment[]): TierBatch[] {
  const out: TierBatch[] = [];
  for (const item of items) {
    const derived = newTierBatch(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function assignTierBatch(item: TierBatch): string {
  return classifyFraudCheckBudget(item.adjustedValue());
}
