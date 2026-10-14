import { classifyFallbackPostRecord } from "../../post/reservation/fallback-post-record-policy.js";
import { PostTarget } from "../../post/reservation/post-target.js";
import { TieredApprovalEstimate, newTieredApprovalEstimate } from "./tiered-approval-estimate.js";

export function summarizePostTargetsForEstimate(items: PostTarget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveTieredApprovalEstimatesFromTarget(items: PostTarget[]): TieredApprovalEstimate[] {
  const out: TieredApprovalEstimate[] = [];
  for (const item of items) {
    const derived = newTieredApprovalEstimate(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function projectTieredApprovalEstimate(item: TieredApprovalEstimate): string {
  return classifyFallbackPostRecord(item.weightedTotal());
}
