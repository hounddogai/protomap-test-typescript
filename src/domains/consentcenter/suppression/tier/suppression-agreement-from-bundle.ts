import { classifyGlobalPreferenceSchedule } from "../../preference/bundle/global-preference-schedule-policy.js";
import { PreferenceBundle } from "../../preference/bundle/preference-bundle.js";
import { SuppressionAgreement, newSuppressionAgreement } from "./suppression-agreement.js";

export function summarizePreferenceBundlesForAgreement(items: PreferenceBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveSuppressionAgreementsFromBundle(items: PreferenceBundle[]): SuppressionAgreement[] {
  const out: SuppressionAgreement[] = [];
  for (const item of items) {
    const derived = newSuppressionAgreement(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function balanceSuppressionAgreement(item: SuppressionAgreement): string {
  return classifyGlobalPreferenceSchedule(item.measuredValue());
}
