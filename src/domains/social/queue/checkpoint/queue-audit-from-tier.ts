import { classifyMentionTier } from "../../mention/agreement/mention-tier-policy.js";
import { MentionTier } from "../../mention/agreement/mention-tier.js";
import { QueueAudit, newQueueAudit } from "./queue-audit.js";

export function summarizeMentionTiersForAudit(items: MentionTier[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveQueueAuditsFromTier(items: MentionTier[]): QueueAudit[] {
  const out: QueueAudit[] = [];
  for (const item of items) {
    const derived = newQueueAudit(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function rankQueueAudit(item: QueueAudit): string {
  return classifyMentionTier(item.adjustedLoad());
}
