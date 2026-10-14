import { conversionOverrideBucket } from "../../conversion/review/conversion-override-policy.js";
import { ConversionReview } from "../../conversion/review/conversion-review.js";
import { PathAgreement, newPathAgreement } from "./path-agreement.js";

export function summarizeConversionReviewsForAgreement(items: ConversionReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function derivePathAgreementsFromReview(items: ConversionReview[]): PathAgreement[] {
  const out: PathAgreement[] = [];
  for (const item of items) {
    const derived = newPathAgreement(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectPathAgreement(item: PathAgreement): string {
  return conversionOverrideBucket(item.measuredValue());
}
