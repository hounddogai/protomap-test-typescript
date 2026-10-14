import { StrictMentionPlan } from "../../mention/profile/strict-mention-plan.js";
import { weightedMentionProfileBucket } from "../../mention/profile/weighted-mention-profile-policy.js";
import { StrictReplyClaim, newStrictReplyClaim } from "./strict-reply-claim.js";

export function summarizeStrictMentionPlansForClaim(items: StrictMentionPlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveStrictReplyClaimsFromPlan(items: StrictMentionPlan[]): StrictReplyClaim[] {
  const out: StrictReplyClaim[] = [];
  for (const item of items) {
    const derived = newStrictReplyClaim(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planStrictReplyClaim(item: StrictReplyClaim): string {
  return weightedMentionProfileBucket(item.adjustedTotal());
}
