import { batchedMentionMilestoneWeight } from "../../mention/milestone/batched-mention-milestone-policy.js";
import { MentionMilestone } from "../../mention/milestone/mention-milestone.js";
import { QueueVariance, newQueueVariance } from "./queue-variance.js";

export function summarizeMentionMilestonesForVariance(items: MentionMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveQueueVariancesFromMilestone(items: MentionMilestone[]): QueueVariance[] {
  const out: QueueVariance[] = [];
  for (const item of items) {
    const derived = newQueueVariance(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planQueueVariance(item: QueueVariance): number {
  return batchedMentionMilestoneWeight(2, true);
}
