import { classifyDefaultInsightException } from "../../insight/segment/default-insight-exception-policy.js";
import { InsightGroup } from "../../insight/segment/insight-group.js";
import { ReplyDraft, newReplyDraft } from "./reply-draft.js";

export function summarizeInsightGroupsForDraft(items: InsightGroup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveReplyDraftsFromGroup(items: InsightGroup[]): ReplyDraft[] {
  const out: ReplyDraft[] = [];
  for (const item of items) {
    const derived = newReplyDraft(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function matchReplyDraft(item: ReplyDraft): string {
  return classifyDefaultInsightException(item.netLoad());
}
