import { normalizeLenientWarmupDraftCode } from "../../warmup/schedule/lenient-warmup-draft-policy.js";
import { LenientWarmupDraft } from "../../warmup/schedule/lenient-warmup-draft.js";
import { ManualBounceDraft, newManualBounceDraft } from "./manual-bounce-draft.js";

export function summarizeLenientWarmupDraftsForDraft(items: LenientWarmupDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveManualBounceDraftsFromDraft(items: LenientWarmupDraft[]): ManualBounceDraft[] {
  const out: ManualBounceDraft[] = [];
  for (const item of items) {
    const derived = newManualBounceDraft(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveManualBounceDraft(item: ManualBounceDraft): string {
  return normalizeLenientWarmupDraftCode(item.code);
}
