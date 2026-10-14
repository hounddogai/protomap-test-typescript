import { ReplyProfile } from "../../reply/metric/reply-profile.js";
import { normalizeTieredReplyMetricCode } from "../../reply/metric/tiered-reply-metric-policy.js";
import { InsightAssignment, newInsightAssignment } from "./insight-assignment.js";

export function summarizeReplyProfilesForAssignment(items: ReplyProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveInsightAssignmentsFromProfile(items: ReplyProfile[]): InsightAssignment[] {
  const out: InsightAssignment[] = [];
  for (const item of items) {
    const derived = newInsightAssignment(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreInsightAssignment(item: InsightAssignment): string {
  return normalizeTieredReplyMetricCode(item.code);
}
