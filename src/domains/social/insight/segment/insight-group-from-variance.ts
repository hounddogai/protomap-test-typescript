import { replyAssignmentBucket } from "../../reply/claim/reply-assignment-policy.js";
import { ReplyVariance } from "../../reply/claim/reply-variance.js";
import { InsightGroup, newInsightGroup } from "./insight-group.js";

export function summarizeReplyVariancesForGroup(items: ReplyVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveInsightGroupsFromVariance(items: ReplyVariance[]): InsightGroup[] {
  const out: InsightGroup[] = [];
  for (const item of items) {
    const derived = newInsightGroup(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeInsightGroup(item: InsightGroup): string {
  return replyAssignmentBucket(item.netLoad());
}
