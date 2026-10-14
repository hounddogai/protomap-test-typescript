import { normalizePendingQueueGroupCode } from "../../queue/group/pending-queue-group-policy.js";
import { RegionalQueueRule } from "../../queue/group/regional-queue-rule.js";
import { PrimaryMentionDraft, newPrimaryMentionDraft } from "./primary-mention-draft.js";

export function summarizeRegionalQueueRulesForDraft(items: RegionalQueueRule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function derivePrimaryMentionDraftsFromRule(items: RegionalQueueRule[]): PrimaryMentionDraft[] {
  const out: PrimaryMentionDraft[] = [];
  for (const item of items) {
    const derived = newPrimaryMentionDraft(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectPrimaryMentionDraft(item: PrimaryMentionDraft): string {
  return normalizePendingQueueGroupCode(item.code);
}
