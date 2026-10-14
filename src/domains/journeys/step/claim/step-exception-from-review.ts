import { CappedJourneyReview } from "../../journey/review/capped-journey-review.js";
import { journeyForecastWeight } from "../../journey/review/journey-forecast-policy.js";
import { StepException, newStepException } from "./step-exception.js";

export function summarizeCappedJourneyReviewsForException(items: CappedJourneyReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveStepExceptionsFromReview(items: CappedJourneyReview[]): StepException[] {
  const out: StepException[] = [];
  for (const item of items) {
    const derived = newStepException(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function planStepException(item: StepException): number {
  return journeyForecastWeight(2, true);
}
