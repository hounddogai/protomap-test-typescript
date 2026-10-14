import { postExceptionBucket } from "../../post/group/post-exception-policy.js";
import { PostRollup } from "../../post/group/post-rollup.js";
import { ApprovalWindow, newApprovalWindow } from "./approval-window.js";

export function summarizePostRollupsForWindow(items: PostRollup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveApprovalWindowsFromRollup(items: PostRollup[]): ApprovalWindow[] {
  const out: ApprovalWindow[] = [];
  for (const item of items) {
    const derived = newApprovalWindow(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyApprovalWindow(item: ApprovalWindow): string {
  return postExceptionBucket(item.adjustedVolume());
}
