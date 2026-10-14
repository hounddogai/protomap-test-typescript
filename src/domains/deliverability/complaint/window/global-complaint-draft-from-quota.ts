import { manualSenderScoreBucket } from "../../sender/sender-segment/manual-sender-score-policy.js";
import { SenderQuota } from "../../sender/sender-segment/sender-quota.js";
import { GlobalComplaintDraft, newGlobalComplaintDraft } from "./global-complaint-draft.js";

export function summarizeSenderQuotasForDraft(items: SenderQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveGlobalComplaintDraftsFromQuota(items: SenderQuota[]): GlobalComplaintDraft[] {
  const out: GlobalComplaintDraft[] = [];
  for (const item of items) {
    const derived = newGlobalComplaintDraft(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planGlobalComplaintDraft(item: GlobalComplaintDraft): string {
  return manualSenderScoreBucket(item.projectedVolume());
}
