import { classifyLenientRetentionDraft } from "../bundle/lenient-retention-draft-policy.js";
import { LenientRetentionDraft } from "../bundle/lenient-retention-draft.js";
import { ScheduledRetentionAllocation, newScheduledRetentionAllocation } from "./scheduled-retention-allocation.js";

export function summarizeLenientRetentionDraftsForAllocation(items: LenientRetentionDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveScheduledRetentionAllocationsFromDraft(items: LenientRetentionDraft[]): ScheduledRetentionAllocation[] {
  const out: ScheduledRetentionAllocation[] = [];
  for (const item of items) {
    const derived = newScheduledRetentionAllocation(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectScheduledRetentionAllocation(item: ScheduledRetentionAllocation): string {
  return classifyLenientRetentionDraft(item.adjustedExposure());
}
