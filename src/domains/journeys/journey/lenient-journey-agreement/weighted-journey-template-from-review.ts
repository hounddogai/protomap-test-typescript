import { classifyFallbackJourneyReview } from "../target/fallback-journey-review-policy.js";
import { FallbackJourneyReview } from "../target/fallback-journey-review.js";
import { WeightedJourneyTemplate, newWeightedJourneyTemplate } from "./weighted-journey-template.js";

export function summarizeFallbackJourneyReviewsForTemplate(items: FallbackJourneyReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveWeightedJourneyTemplatesFromReview(items: FallbackJourneyReview[]): WeightedJourneyTemplate[] {
  const out: WeightedJourneyTemplate[] = [];
  for (const item of items) {
    const derived = newWeightedJourneyTemplate(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function splitWeightedJourneyTemplate(item: WeightedJourneyTemplate): string {
  return classifyFallbackJourneyReview(item.projectedValue());
}
