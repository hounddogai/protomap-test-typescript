import { DefaultPacingAgreement } from "../../pacing/pacing-review/default-pacing-agreement.js";
import { normalizeGlobalPacingReviewCode } from "../../pacing/pacing-review/global-pacing-review-policy.js";
import { DefaultPlacementEstimate, newDefaultPlacementEstimate } from "./default-placement-estimate.js";

export function summarizeDefaultPacingAgreementsForEstimate(items: DefaultPacingAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveDefaultPlacementEstimatesFromAgreement(items: DefaultPacingAgreement[]): DefaultPlacementEstimate[] {
  const out: DefaultPlacementEstimate[] = [];
  for (const item of items) {
    const derived = newDefaultPlacementEstimate(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settleDefaultPlacementEstimate(item: DefaultPlacementEstimate): string {
  return normalizeGlobalPacingReviewCode(item.code);
}
