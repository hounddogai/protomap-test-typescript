import { classifyManualPacingVariance } from "../estimate/manual-pacing-variance-policy.js";
import { PacingNotice } from "../estimate/pacing-notice.js";
import { RollingPacingAgreement, newRollingPacingAgreement } from "./rolling-pacing-agreement.js";

export function summarizePacingNoticesForAgreement(items: PacingNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveRollingPacingAgreementsFromNotice(items: PacingNotice[]): RollingPacingAgreement[] {
  const out: RollingPacingAgreement[] = [];
  for (const item of items) {
    const derived = newRollingPacingAgreement(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function projectRollingPacingAgreement(item: RollingPacingAgreement): string {
  return classifyManualPacingVariance(item.measuredValue());
}
