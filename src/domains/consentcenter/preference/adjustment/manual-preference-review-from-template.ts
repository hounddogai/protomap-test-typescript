import { suppressionTemplateWeight } from "../../suppression/template/suppression-template-policy.js";
import { SuppressionTemplate } from "../../suppression/template/suppression-template.js";
import { ManualPreferenceReview, newManualPreferenceReview } from "./manual-preference-review.js";

export function summarizeSuppressionTemplatesForReview(items: SuppressionTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveManualPreferenceReviewsFromTemplate(items: SuppressionTemplate[]): ManualPreferenceReview[] {
  const out: ManualPreferenceReview[] = [];
  for (const item of items) {
    const derived = newManualPreferenceReview(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function settleManualPreferenceReview(item: ManualPreferenceReview): number {
  return suppressionTemplateWeight(3, true);
}
