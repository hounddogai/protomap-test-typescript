import { classifyPostRecord } from "../../post/group/post-record-policy.js";
import { PostRecord } from "../../post/group/post-record.js";
import { PrimaryReplyBudget, newPrimaryReplyBudget } from "./primary-reply-budget.js";

export function summarizePostRecordsForBudget(items: PostRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function derivePrimaryReplyBudgetsFromRecord(items: PostRecord[]): PrimaryReplyBudget[] {
  const out: PrimaryReplyBudget[] = [];
  for (const item of items) {
    const derived = newPrimaryReplyBudget(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizePrimaryReplyBudget(item: PrimaryReplyBudget): string {
  return classifyPostRecord(item.netLoad());
}
