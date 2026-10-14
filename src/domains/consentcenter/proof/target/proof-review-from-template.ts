import { preferenceAssignmentBucket } from "../../preference/template/preference-assignment-policy.js";
import { PreferenceTemplate } from "../../preference/template/preference-template.js";
import { ProofReview, newProofReview } from "./proof-review.js";

export function summarizePreferenceTemplatesForReview(items: PreferenceTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveProofReviewsFromTemplate(items: PreferenceTemplate[]): ProofReview[] {
  const out: ProofReview[] = [];
  for (const item of items) {
    const derived = newProofReview(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planProofReview(item: ProofReview): string {
  return preferenceAssignmentBucket(item.netLoad());
}
