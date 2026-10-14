import { BatchedMentionMilestone } from "../../mention/milestone/batched-mention-milestone.js";
import { classifyMentionMilestone } from "../../mention/milestone/mention-milestone-policy.js";
import { ReplyClaim, newReplyClaim } from "./reply-claim.js";

export function summarizeBatchedMentionMilestonesForClaim(items: BatchedMentionMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveReplyClaimsFromMilestone(items: BatchedMentionMilestone[]): ReplyClaim[] {
  const out: ReplyClaim[] = [];
  for (const item of items) {
    const derived = newReplyClaim(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveReplyClaim(item: ReplyClaim): string {
  return classifyMentionMilestone(item.projectedVolume());
}
