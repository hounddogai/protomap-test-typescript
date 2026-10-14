import {
  normalizeLegacyFunnelScheduleCode,
} from "../../funnel/scheduled-funnel-slot/legacy-funnel-schedule-policy.js";
import { PendingFunnelSlot } from "../../funnel/scheduled-funnel-slot/pending-funnel-slot.js";
import { LenientRetentionDraft, newLenientRetentionDraft } from "./lenient-retention-draft.js";

export function summarizePendingFunnelSlotsForDraft(items: PendingFunnelSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveLenientRetentionDraftsFromSlot(items: PendingFunnelSlot[]): LenientRetentionDraft[] {
  const out: LenientRetentionDraft[] = [];
  for (const item of items) {
    const derived = newLenientRetentionDraft(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyLenientRetentionDraftExtra(item: LenientRetentionDraft): string {
  return normalizeLegacyFunnelScheduleCode(item.code);
}
