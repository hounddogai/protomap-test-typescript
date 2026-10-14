import { normalizeApprovalExceptionCode } from "../../approval/approval-record/approval-exception-policy.js";
import { ScheduledApprovalManifest } from "../../approval/approval-record/scheduled-approval-manifest.js";
import { PostException, newPostException } from "./post-exception.js";

export function summarizeScheduledApprovalManifestsForException(items: ScheduledApprovalManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function derivePostExceptionsFromManifest(items: ScheduledApprovalManifest[]): PostException[] {
  const out: PostException[] = [];
  for (const item of items) {
    const derived = newPostException(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function mergePostException(item: PostException): string {
  return normalizeApprovalExceptionCode(item.code);
}
