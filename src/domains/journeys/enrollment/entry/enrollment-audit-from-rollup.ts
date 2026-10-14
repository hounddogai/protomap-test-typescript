import { LegacyWaitRollup } from "../../wait/profile/legacy-wait-rollup.js";
import { normalizeWeightedWaitProfileCode } from "../../wait/profile/weighted-wait-profile-policy.js";
import { EnrollmentAudit, newEnrollmentAudit } from "./enrollment-audit.js";

export function summarizeLegacyWaitRollupsForAudit(items: LegacyWaitRollup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveEnrollmentAuditsFromRollup(items: LegacyWaitRollup[]): EnrollmentAudit[] {
  const out: EnrollmentAudit[] = [];
  for (const item of items) {
    const derived = newEnrollmentAudit(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateEnrollmentAudit(item: EnrollmentAudit): string {
  return normalizeWeightedWaitProfileCode(item.code);
}
