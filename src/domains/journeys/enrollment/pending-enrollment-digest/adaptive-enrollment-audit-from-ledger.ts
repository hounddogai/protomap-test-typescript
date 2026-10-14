import { StepLedger } from "../../step/batch/step-ledger.js";
import { classifyStrictStepProposal } from "../../step/batch/strict-step-proposal-policy.js";
import { AdaptiveEnrollmentAudit, newAdaptiveEnrollmentAudit } from "./adaptive-enrollment-audit.js";

export function summarizeStepLedgersForAudit(items: StepLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveAdaptiveEnrollmentAuditsFromLedger(items: StepLedger[]): AdaptiveEnrollmentAudit[] {
  const out: AdaptiveEnrollmentAudit[] = [];
  for (const item of items) {
    const derived = newAdaptiveEnrollmentAudit(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function projectAdaptiveEnrollmentAudit(item: AdaptiveEnrollmentAudit): string {
  return classifyStrictStepProposal(item.adjustedLoad());
}
