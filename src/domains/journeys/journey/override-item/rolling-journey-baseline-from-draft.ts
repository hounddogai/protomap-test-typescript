import {
  normalizeAdaptiveEnrollmentAuditCode,
} from "../../enrollment/pending-enrollment-digest/adaptive-enrollment-audit-policy.js";
import { LenientEnrollmentDraft } from "../../enrollment/pending-enrollment-digest/lenient-enrollment-draft.js";
import { RollingJourneyBaseline, newRollingJourneyBaseline } from "./rolling-journey-baseline.js";

export function summarizeLenientEnrollmentDraftsForBaseline(items: LenientEnrollmentDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveRollingJourneyBaselinesFromDraft(items: LenientEnrollmentDraft[]): RollingJourneyBaseline[] {
  const out: RollingJourneyBaseline[] = [];
  for (const item of items) {
    const derived = newRollingJourneyBaseline(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function assignRollingJourneyBaseline(item: RollingJourneyBaseline): string {
  return normalizeAdaptiveEnrollmentAuditCode(item.code);
}
