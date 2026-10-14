import { CappedEnrollmentEstimate } from "../../enrollment/enrollment-estimate/capped-enrollment-estimate.js";
import {
  manualEnrollmentPreferenceWeight,
} from "../../enrollment/enrollment-estimate/manual-enrollment-preference-policy.js";
import { SeasonalWaitException, newSeasonalWaitException } from "./seasonal-wait-exception.js";

export function summarizeCappedEnrollmentEstimatesForException(items: CappedEnrollmentEstimate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveSeasonalWaitExceptionsFromEstimate(items: CappedEnrollmentEstimate[]): SeasonalWaitException[] {
  const out: SeasonalWaitException[] = [];
  for (const item of items) {
    const derived = newSeasonalWaitException(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function settleSeasonalWaitException(item: SeasonalWaitException): number {
  return manualEnrollmentPreferenceWeight(7, true);
}
