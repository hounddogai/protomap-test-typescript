import { classifyInsightSnapshot } from "../../insight/snapshot/insight-snapshot-policy.js";
import { InsightSnapshot } from "../../insight/snapshot/insight-snapshot.js";
import { MentionMilestone, newMentionMilestone } from "./mention-milestone.js";

export function summarizeInsightSnapshotsForMilestone(items: InsightSnapshot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveMentionMilestonesFromSnapshot(items: InsightSnapshot[]): MentionMilestone[] {
  const out: MentionMilestone[] = [];
  for (const item of items) {
    const derived = newMentionMilestone(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveMentionMilestone(item: MentionMilestone): string {
  return classifyInsightSnapshot(item.adjustedTotal());
}
