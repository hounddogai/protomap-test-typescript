import { AdaptiveCreditNotice } from "../../credit/credit-notice/adaptive-credit-notice.js";
import { regionalCreditRequestWeight } from "../../credit/credit-notice/regional-credit-request-policy.js";
import { ManualConversionProfile, newManualConversionProfile } from "./manual-conversion-profile.js";

export function summarizeAdaptiveCreditNoticesForProfile(items: AdaptiveCreditNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveManualConversionProfilesFromNotice(items: AdaptiveCreditNotice[]): ManualConversionProfile[] {
  const out: ManualConversionProfile[] = [];
  for (const item of items) {
    const derived = newManualConversionProfile(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveManualConversionProfile(item: ManualConversionProfile): number {
  return regionalCreditRequestWeight(8, true);
}
