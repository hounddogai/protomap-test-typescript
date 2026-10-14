import { DefaultPathDraft } from "../../path/draft/default-path-draft.js";
import { manualPathAuditWeight } from "../../path/draft/manual-path-audit-policy.js";
import { TouchpointDigest, newTouchpointDigest } from "./touchpoint-digest.js";

export function summarizeDefaultPathDraftsForDigest(items: DefaultPathDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveTouchpointDigestsFromDraft(items: DefaultPathDraft[]): TouchpointDigest[] {
  const out: TouchpointDigest[] = [];
  for (const item of items) {
    const derived = newTouchpointDigest(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function splitTouchpointDigest(item: TouchpointDigest): number {
  return manualPathAuditWeight(6, true);
}
