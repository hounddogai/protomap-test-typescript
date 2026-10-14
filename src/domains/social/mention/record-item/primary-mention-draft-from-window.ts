import { manualPostSnapshotWeight } from "../../post/target/manual-post-snapshot-policy.js";
import { TieredPostWindow } from "../../post/target/tiered-post-window.js";
import { PrimaryMentionDraft, newPrimaryMentionDraft } from "./primary-mention-draft.js";

export function summarizeTieredPostWindowsForDraft(items: TieredPostWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function derivePrimaryMentionDraftsFromWindow(items: TieredPostWindow[]): PrimaryMentionDraft[] {
  const out: PrimaryMentionDraft[] = [];
  for (const item of items) {
    const derived = newPrimaryMentionDraft(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function scorePrimaryMentionDraft(item: PrimaryMentionDraft): number {
  return manualPostSnapshotWeight(7, true);
}
