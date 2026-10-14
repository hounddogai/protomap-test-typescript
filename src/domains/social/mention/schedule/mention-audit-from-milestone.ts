import { normalizePostAllocationCode } from "../../post/milestone/post-allocation-policy.js";
import { PostMilestone } from "../../post/milestone/post-milestone.js";
import { MentionAudit, newMentionAudit } from "./mention-audit.js";

export function summarizePostMilestonesForAudit(items: PostMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveMentionAuditsFromMilestone(items: PostMilestone[]): MentionAudit[] {
  const out: MentionAudit[] = [];
  for (const item of items) {
    const derived = newMentionAudit(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateMentionAudit(item: MentionAudit): string {
  return normalizePostAllocationCode(item.code);
}
