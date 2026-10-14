import { primaryPacingAgreementBucket } from "../../pacing/pacing-agreement/primary-pacing-agreement-policy.js";
import { PrimaryPacingAgreement } from "../../pacing/pacing-agreement/primary-pacing-agreement.js";
import { ManualCreativeAudit, newManualCreativeAudit } from "./manual-creative-audit.js";

export function summarizePrimaryPacingAgreementsForAudit(items: PrimaryPacingAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveManualCreativeAuditsFromAgreement(items: PrimaryPacingAgreement[]): ManualCreativeAudit[] {
  const out: ManualCreativeAudit[] = [];
  for (const item of items) {
    const derived = newManualCreativeAudit(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergeManualCreativeAudit(item: ManualCreativeAudit): string {
  return primaryPacingAgreementBucket(item.weightedTotal());
}
