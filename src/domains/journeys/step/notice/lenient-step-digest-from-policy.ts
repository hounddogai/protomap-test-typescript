import { normalizeJourneyMilestoneCode } from "../../journey/policy/journey-milestone-policy.js";
import { LenientJourneyPolicy } from "../../journey/policy/lenient-journey-policy.js";
import { LenientStepDigest, newLenientStepDigest } from "./lenient-step-digest.js";

export function summarizeLenientJourneyPoliciesForDigest(items: LenientJourneyPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveLenientStepDigestsFromPolicy(items: LenientJourneyPolicy[]): LenientStepDigest[] {
  const out: LenientStepDigest[] = [];
  for (const item of items) {
    const derived = newLenientStepDigest(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveLenientStepDigest(item: LenientStepDigest): string {
  return normalizeJourneyMilestoneCode(item.code);
}
