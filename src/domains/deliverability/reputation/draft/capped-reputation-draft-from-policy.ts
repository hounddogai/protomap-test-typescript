import { LegacyDomainPolicy } from "../../domain/score/legacy-domain-policy.js";
import { manualDomainScoreBucket } from "../../domain/score/manual-domain-score-policy.js";
import { CappedReputationDraft, newCappedReputationDraft } from "./capped-reputation-draft.js";

export function summarizeLegacyDomainPoliciesForDraft(items: LegacyDomainPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveCappedReputationDraftsFromPolicy(items: LegacyDomainPolicy[]): CappedReputationDraft[] {
  const out: CappedReputationDraft[] = [];
  for (const item of items) {
    const derived = newCappedReputationDraft(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateCappedReputationDraft(item: CappedReputationDraft): string {
  return manualDomainScoreBucket(item.effectiveLoad());
}
