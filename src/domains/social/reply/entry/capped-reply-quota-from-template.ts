import { queueTemplateWeight } from "../../queue/target/queue-template-policy.js";
import { QueueTemplate } from "../../queue/target/queue-template.js";
import { CappedReplyQuota, newCappedReplyQuota } from "./capped-reply-quota.js";

export function summarizeQueueTemplatesForQuota(items: QueueTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveCappedReplyQuotasFromTemplate(items: QueueTemplate[]): CappedReplyQuota[] {
  const out: CappedReplyQuota[] = [];
  for (const item of items) {
    const derived = newCappedReplyQuota(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeCappedReplyQuota(item: CappedReplyQuota): number {
  return queueTemplateWeight(6, true);
}
