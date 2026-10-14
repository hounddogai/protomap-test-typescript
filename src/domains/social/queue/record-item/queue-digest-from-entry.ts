import { ApprovalEntry } from "../../approval/approval-agreement/approval-entry.js";
import {
  classifyPrimaryApprovalAgreement,
} from "../../approval/approval-agreement/primary-approval-agreement-policy.js";
import { QueueDigest, newQueueDigest } from "./queue-digest.js";

export function summarizeApprovalEntriesForDigest(items: ApprovalEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveQueueDigestsFromEntry(items: ApprovalEntry[]): QueueDigest[] {
  const out: QueueDigest[] = [];
  for (const item of items) {
    const derived = newQueueDigest(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function scoreQueueDigest(item: QueueDigest): string {
  return classifyPrimaryApprovalAgreement(item.effectiveVolume());
}
