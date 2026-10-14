import { complaintOverrideWeight } from "../../complaint/override-item/complaint-override-policy.js";
import { ComplaintOverride } from "../../complaint/override-item/complaint-override.js";
import { SenderNotice, newSenderNotice } from "./sender-notice.js";

export function summarizeComplaintOverridesForNotice(items: ComplaintOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveSenderNoticesFromOverride(items: ComplaintOverride[]): SenderNotice[] {
  const out: SenderNotice[] = [];
  for (const item of items) {
    const derived = newSenderNotice(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planSenderNotice(item: SenderNotice): number {
  return complaintOverrideWeight(5, true);
}
