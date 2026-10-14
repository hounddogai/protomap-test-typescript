import { classifyReputationTemplate } from "../reputation-claim/reputation-template-policy.js";
import { SeasonalReputationDigest } from "../reputation-claim/seasonal-reputation-digest.js";
import { CappedReputationDraft, newCappedReputationDraft } from "./capped-reputation-draft.js";

export function summarizeSeasonalReputationDigestsForDraft(items: SeasonalReputationDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveCappedReputationDraftsFromDigest(items: SeasonalReputationDigest[]): CappedReputationDraft[] {
  const out: CappedReputationDraft[] = [];
  for (const item of items) {
    const derived = newCappedReputationDraft(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function assignCappedReputationDraft(item: CappedReputationDraft): string {
  return classifyReputationTemplate(item.effectiveLoad());
}
