import { normalizeBatchedPostOverrideCode } from "../../post/post-proposal/batched-post-override-policy.js";
import { RegionalPostProposal } from "../../post/post-proposal/regional-post-proposal.js";
import { WeightedInsightDraft, newWeightedInsightDraft } from "./weighted-insight-draft.js";

export function summarizeRegionalPostProposalsForDraft(items: RegionalPostProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveWeightedInsightDraftsFromProposal(items: RegionalPostProposal[]): WeightedInsightDraft[] {
  const out: WeightedInsightDraft[] = [];
  for (const item of items) {
    const derived = newWeightedInsightDraft(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifyWeightedInsightDraftExtra(item: WeightedInsightDraft): string {
  return normalizeBatchedPostOverrideCode(item.code);
}
