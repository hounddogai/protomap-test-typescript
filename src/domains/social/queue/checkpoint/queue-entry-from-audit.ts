import { ApprovalAudit } from "../../approval/rollup/approval-audit.js";
import { classifyManualApprovalQuota } from "../../approval/rollup/manual-approval-quota-policy.js";
import { QueueEntry, newQueueEntry } from "./queue-entry.js";

export function summarizeApprovalAuditsForEntry(items: ApprovalAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveQueueEntriesFromAudit(items: ApprovalAudit[]): QueueEntry[] {
  const out: QueueEntry[] = [];
  for (const item of items) {
    const derived = newQueueEntry(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyQueueEntryExtra(item: QueueEntry): string {
  return classifyManualApprovalQuota(item.netExposure());
}
