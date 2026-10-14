import { RedemptionAgreement } from "../../redemption/batch/redemption-agreement.js";
import { redemptionBatchBucket } from "../../redemption/batch/redemption-batch-policy.js";
import { ManualRewardEntry, newManualRewardEntry } from "./manual-reward-entry.js";

export function summarizeRedemptionAgreementsForEntry(items: RedemptionAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveManualRewardEntriesFromAgreement(items: RedemptionAgreement[]): ManualRewardEntry[] {
  const out: ManualRewardEntry[] = [];
  for (const item of items) {
    const derived = newManualRewardEntry(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settleManualRewardEntry(item: ManualRewardEntry): string {
  return redemptionBatchBucket(item.adjustedExposure());
}
