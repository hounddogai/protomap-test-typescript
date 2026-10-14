import { classifyGlobalPostRequest } from "../../post/profile/global-post-request-policy.js";
import { PostMetric } from "../../post/profile/post-metric.js";
import { StrictApprovalRollup, newStrictApprovalRollup } from "./strict-approval-rollup.js";

export function summarizePostMetricsForRollup(items: PostMetric[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveStrictApprovalRollupsFromMetric(items: PostMetric[]): StrictApprovalRollup[] {
  const out: StrictApprovalRollup[] = [];
  for (const item of items) {
    const derived = newStrictApprovalRollup(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function scoreStrictApprovalRollup(item: StrictApprovalRollup): string {
  return classifyGlobalPostRequest(item.projectedTotal());
}
