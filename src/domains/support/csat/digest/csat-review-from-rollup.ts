import { DeflectionRollup } from "../../deflection/deflection-tier/deflection-rollup.js";
import {
  normalizePendingDeflectionAgreementCode,
} from "../../deflection/deflection-tier/pending-deflection-agreement-policy.js";
import { CsatReview, newCsatReview } from "./csat-review.js";

export function summarizeDeflectionRollupsForReview(items: DeflectionRollup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveCsatReviewsFromRollup(items: DeflectionRollup[]): CsatReview[] {
  const out: CsatReview[] = [];
  for (const item of items) {
    const derived = newCsatReview(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchCsatReview(item: CsatReview): string {
  return normalizePendingDeflectionAgreementCode(item.code);
}
