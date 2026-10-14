import { LegacyWindowDraft } from "../estimate/legacy-window-draft.js";
import { classifyWindowException } from "../estimate/window-exception-policy.js";
import { PendingWindowManifest, newPendingWindowManifest } from "./pending-window-manifest.js";

export function summarizeLegacyWindowDraftsForManifest(items: LegacyWindowDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function derivePendingWindowManifestsFromDraft(items: LegacyWindowDraft[]): PendingWindowManifest[] {
  const out: PendingWindowManifest[] = [];
  for (const item of items) {
    const derived = newPendingWindowManifest(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function balancePendingWindowManifest(item: PendingWindowManifest): string {
  return classifyWindowException(item.netExposure());
}
