import { ReputationMilestone } from "../../reputation/notice/reputation-milestone.js";
import { reputationNoticeWeight } from "../../reputation/notice/reputation-notice-policy.js";
import { SenderGroup, newSenderGroup } from "./sender-group.js";

export function summarizeReputationMilestonesForGroup(items: ReputationMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveSenderGroupsFromMilestone(items: ReputationMilestone[]): SenderGroup[] {
  const out: SenderGroup[] = [];
  for (const item of items) {
    const derived = newSenderGroup(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function rankSenderGroup(item: SenderGroup): number {
  return reputationNoticeWeight(5, true);
}
