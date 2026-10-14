import { LegacyComplaintDraft } from "../../complaint/draft/legacy-complaint-draft.js";
import { classifySeasonalComplaintAgreement } from "../../complaint/draft/seasonal-complaint-agreement-policy.js";
import { SenderBundle, newSenderBundle } from "./sender-bundle.js";

export function summarizeLegacyComplaintDraftsForBundle(items: LegacyComplaintDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveSenderBundlesFromDraft(items: LegacyComplaintDraft[]): SenderBundle[] {
  const out: SenderBundle[] = [];
  for (const item of items) {
    const derived = newSenderBundle(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileSenderBundle(item: SenderBundle): string {
  return classifySeasonalComplaintAgreement(item.effectiveTotal());
}
