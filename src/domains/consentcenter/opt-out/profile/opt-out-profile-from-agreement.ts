import { SuppressionAgreement } from "../../suppression/tier/suppression-agreement.js";
import { suppressionTierBucket } from "../../suppression/tier/suppression-tier-policy.js";
import { OptOutProfile, newOptOutProfile } from "./opt-out-profile.js";

export function summarizeSuppressionAgreementsForProfile(items: SuppressionAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveOptOutProfilesFromAgreement(items: SuppressionAgreement[]): OptOutProfile[] {
  const out: OptOutProfile[] = [];
  for (const item of items) {
    const derived = newOptOutProfile(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function matchOptOutProfile(item: OptOutProfile): string {
  return suppressionTierBucket(item.adjustedExposure());
}
