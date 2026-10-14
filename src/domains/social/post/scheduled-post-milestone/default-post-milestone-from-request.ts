import { cappedMentionBaselineWeight } from "../../mention/request/capped-mention-baseline-policy.js";
import { MentionRequest } from "../../mention/request/mention-request.js";
import { DefaultPostMilestone, newDefaultPostMilestone } from "./default-post-milestone.js";

export function summarizeMentionRequestsForMilestone(items: MentionRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveDefaultPostMilestonesFromRequest(items: MentionRequest[]): DefaultPostMilestone[] {
  const out: DefaultPostMilestone[] = [];
  for (const item of items) {
    const derived = newDefaultPostMilestone(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreDefaultPostMilestone(item: DefaultPostMilestone): number {
  return cappedMentionBaselineWeight(8, true);
}
