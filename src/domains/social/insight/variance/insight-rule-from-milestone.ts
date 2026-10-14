import { normalizePostAllocationCode } from "../../post/milestone/post-allocation-policy.js";
import { PostMilestone } from "../../post/milestone/post-milestone.js";
import { InsightRule, newInsightRule } from "./insight-rule.js";

export function summarizePostMilestonesForRule(items: PostMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveInsightRulesFromMilestone(items: PostMilestone[]): InsightRule[] {
  const out: InsightRule[] = [];
  for (const item of items) {
    const derived = newInsightRule(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateInsightRule(item: InsightRule): string {
  return normalizePostAllocationCode(item.code);
}
