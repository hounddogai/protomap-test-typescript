import { adaptiveApprovalAgreementWeight } from "../../approval/mapping/adaptive-approval-agreement-policy.js";
import { AdaptiveApprovalAgreement } from "../../approval/mapping/adaptive-approval-agreement.js";
import { InsightBatch, newInsightBatch } from "./insight-batch.js";

export function summarizeAdaptiveApprovalAgreementsForBatch(items: AdaptiveApprovalAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveInsightBatchesFromAgreement(items: AdaptiveApprovalAgreement[]): InsightBatch[] {
  const out: InsightBatch[] = [];
  for (const item of items) {
    const derived = newInsightBatch(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchInsightBatch(item: InsightBatch): number {
  return adaptiveApprovalAgreementWeight(3, true);
}
