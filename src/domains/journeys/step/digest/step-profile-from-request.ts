import { AdaptiveEnrollmentRequest } from "../../enrollment/enrollment-mapping/adaptive-enrollment-request.js";
import { classifyEnrollmentPreference } from "../../enrollment/enrollment-mapping/enrollment-preference-policy.js";
import { StepProfile, newStepProfile } from "./step-profile.js";

export function summarizeAdaptiveEnrollmentRequestsForProfile(items: AdaptiveEnrollmentRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveStepProfilesFromRequest(items: AdaptiveEnrollmentRequest[]): StepProfile[] {
  const out: StepProfile[] = [];
  for (const item of items) {
    const derived = newStepProfile(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function projectStepProfile(item: StepProfile): string {
  return classifyEnrollmentPreference(item.weightedVolume());
}
