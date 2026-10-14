import { fallbackFraudCheckExceptionBucket } from "../notice/fallback-fraud-check-exception-policy.js";
import { LegacyFraudCheckBundle } from "../notice/legacy-fraud-check-bundle.js";
import { ManualFraudCheckAgreement, newManualFraudCheckAgreement } from "./manual-fraud-check-agreement.js";

export function summarizeLegacyFraudCheckBundlesForAgreement(items: LegacyFraudCheckBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveManualFraudCheckAgreementsFromBundle(items: LegacyFraudCheckBundle[]): ManualFraudCheckAgreement[] {
  const out: ManualFraudCheckAgreement[] = [];
  for (const item of items) {
    const derived = newManualFraudCheckAgreement(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileManualFraudCheckAgreement(item: ManualFraudCheckAgreement): string {
  return fallbackFraudCheckExceptionBucket(item.measuredValue());
}
