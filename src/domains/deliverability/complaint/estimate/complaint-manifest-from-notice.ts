import { BounceNotice } from "../../bounce/notice/bounce-notice.js";
import { regionalBounceNoticeWeight } from "../../bounce/notice/regional-bounce-notice-policy.js";
import { ComplaintManifest, newComplaintManifest } from "./complaint-manifest.js";

export function summarizeBounceNoticesForManifest(items: BounceNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveComplaintManifestsFromNotice(items: BounceNotice[]): ComplaintManifest[] {
  const out: ComplaintManifest[] = [];
  for (const item of items) {
    const derived = newComplaintManifest(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignComplaintManifest(item: ComplaintManifest): number {
  return regionalBounceNoticeWeight(3, true);
}
