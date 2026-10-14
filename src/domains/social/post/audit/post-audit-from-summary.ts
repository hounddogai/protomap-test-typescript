import { approvalScoreWeight } from "../../approval/score/approval-score-policy.js";
import { TieredApprovalSummary } from "../../approval/score/tiered-approval-summary.js";
import { PostAudit, newPostAudit } from "./post-audit.js";

export function summarizeTieredApprovalSummariesForAudit(items: TieredApprovalSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function derivePostAuditsFromSummary(items: TieredApprovalSummary[]): PostAudit[] {
  const out: PostAudit[] = [];
  for (const item of items) {
    const derived = newPostAudit(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function mergePostAudit(item: PostAudit): number {
  return approvalScoreWeight(4, true);
}
