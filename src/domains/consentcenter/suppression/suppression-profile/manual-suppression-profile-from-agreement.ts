import {
  scheduledDoubleOptInAgreementBucket,
} from "../../double-opt-in/in-allocation/scheduled-double-opt-in-agreement-policy.js";
import {
  ScheduledDoubleOptInAgreement,
} from "../../double-opt-in/in-allocation/scheduled-double-opt-in-agreement.js";
import { ManualSuppressionProfile, newManualSuppressionProfile } from "./manual-suppression-profile.js";

export function summarizeScheduledDoubleOptInAgreementsForProfile(items: ScheduledDoubleOptInAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveManualSuppressionProfilesFromAgreement(items: ScheduledDoubleOptInAgreement[]): ManualSuppressionProfile[] {
  const out: ManualSuppressionProfile[] = [];
  for (const item of items) {
    const derived = newManualSuppressionProfile(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeManualSuppressionProfileExtra(item: ManualSuppressionProfile): string {
  return scheduledDoubleOptInAgreementBucket(item.effectiveExposure());
}
