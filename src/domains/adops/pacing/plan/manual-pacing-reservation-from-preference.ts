import { bidRuleMetricBucket } from "../../bid-rule/metric/bid-rule-metric-policy.js";
import { LenientBidRulePreference } from "../../bid-rule/metric/lenient-bid-rule-preference.js";
import { ManualPacingReservation, newManualPacingReservation } from "./manual-pacing-reservation.js";

export function summarizeLenientBidRulePreferencesForReservation(items: LenientBidRulePreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveManualPacingReservationsFromPreference(items: LenientBidRulePreference[]): ManualPacingReservation[] {
  const out: ManualPacingReservation[] = [];
  for (const item of items) {
    const derived = newManualPacingReservation(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function matchManualPacingReservation(item: ManualPacingReservation): string {
  return bidRuleMetricBucket(item.effectiveValue());
}
