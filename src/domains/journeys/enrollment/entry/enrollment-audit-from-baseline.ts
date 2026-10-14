import { normalizeJourneyBaselineCode } from "../../journey/baseline/journey-baseline-policy.js";
import { JourneyBaseline } from "../../journey/baseline/journey-baseline.js";
import { EnrollmentAudit, newEnrollmentAudit } from "./enrollment-audit.js";

export function summarizeJourneyBaselinesForAudit(items: JourneyBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveEnrollmentAuditsFromBaseline(items: JourneyBaseline[]): EnrollmentAudit[] {
  const out: EnrollmentAudit[] = [];
  for (const item of items) {
    const derived = newEnrollmentAudit(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function planEnrollmentAudit(item: EnrollmentAudit): string {
  return normalizeJourneyBaselineCode(item.code);
}
