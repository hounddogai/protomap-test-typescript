import {
  classifyLegacyApprovalAllocation,
} from "../../approval/approval-record/legacy-approval-allocation-policy.js";
import { RegionalApprovalRecord } from "../../approval/approval-record/regional-approval-record.js";
import { LenientQueueDraft, newLenientQueueDraft } from "./lenient-queue-draft.js";

export function summarizeRegionalApprovalRecordsForDraft(items: RegionalApprovalRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveLenientQueueDraftsFromRecord(items: RegionalApprovalRecord[]): LenientQueueDraft[] {
  const out: LenientQueueDraft[] = [];
  for (const item of items) {
    const derived = newLenientQueueDraft(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function settleLenientQueueDraft(item: LenientQueueDraft): string {
  return classifyLegacyApprovalAllocation(item.measuredValue());
}
