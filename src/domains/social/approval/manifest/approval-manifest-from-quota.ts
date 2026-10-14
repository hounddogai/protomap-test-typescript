import { ApprovalQuota } from "../quota/approval-quota.js";
import { approvalReviewWeight } from "../quota/approval-review-policy.js";
import { ApprovalManifest, newApprovalManifest } from "./approval-manifest.js";

export function summarizeApprovalQuotasForManifest(items: ApprovalQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveApprovalManifestsFromQuota(items: ApprovalQuota[]): ApprovalManifest[] {
  const out: ApprovalManifest[] = [];
  for (const item of items) {
    const derived = newApprovalManifest(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function scoreApprovalManifest(item: ApprovalManifest): number {
  return approvalReviewWeight(9, true);
}
