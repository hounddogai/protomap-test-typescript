import { PreferenceReview } from "../../preference/schedule/preference-review.js";
import { normalizePreferenceScheduleCode } from "../../preference/schedule/preference-schedule-policy.js";
import { SuppressionLedger, newSuppressionLedger } from "./suppression-ledger.js";

export function summarizePreferenceReviewsForLedger(items: PreferenceReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveSuppressionLedgersFromReview(items: PreferenceReview[]): SuppressionLedger[] {
  const out: SuppressionLedger[] = [];
  for (const item of items) {
    const derived = newSuppressionLedger(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function rankSuppressionLedger(item: SuppressionLedger): string {
  return normalizePreferenceScheduleCode(item.code);
}
