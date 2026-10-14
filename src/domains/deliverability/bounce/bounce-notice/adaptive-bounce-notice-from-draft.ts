import { bounceDraftWeight } from "../draft/bounce-draft-policy.js";
import { BounceDraft } from "../draft/bounce-draft.js";
import { AdaptiveBounceNotice, newAdaptiveBounceNotice } from "./adaptive-bounce-notice.js";

export function summarizeBounceDraftsForNotice(items: BounceDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveAdaptiveBounceNoticesFromDraft(items: BounceDraft[]): AdaptiveBounceNotice[] {
  const out: AdaptiveBounceNotice[] = [];
  for (const item of items) {
    const derived = newAdaptiveBounceNotice(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeAdaptiveBounceNotice(item: AdaptiveBounceNotice): number {
  return bounceDraftWeight(8, true);
}
