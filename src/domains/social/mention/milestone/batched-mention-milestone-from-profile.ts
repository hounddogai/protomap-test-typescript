import { MentionProfile } from "../claim/mention-profile.js";
import { mentionRuleWeight } from "../claim/mention-rule-policy.js";
import { BatchedMentionMilestone, newBatchedMentionMilestone } from "./batched-mention-milestone.js";

export function summarizeMentionProfilesForMilestone(items: MentionProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveBatchedMentionMilestonesFromProfile(items: MentionProfile[]): BatchedMentionMilestone[] {
  const out: BatchedMentionMilestone[] = [];
  for (const item of items) {
    const derived = newBatchedMentionMilestone(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeBatchedMentionMilestone(item: BatchedMentionMilestone): number {
  return mentionRuleWeight(6, true);
}
