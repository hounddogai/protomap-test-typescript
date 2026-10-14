import { normalizeLenientProofAuditCode } from "../../proof/proof-audit/lenient-proof-audit-policy.js";
import { ScheduledProofAssignment } from "../../proof/proof-audit/scheduled-proof-assignment.js";
import { DoubleOptInVariance, newDoubleOptInVariance } from "./double-opt-in-variance.js";

export function summarizeScheduledProofAssignmentsForVariance(items: ScheduledProofAssignment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveDoubleOptInVariancesFromAssignment(items: ScheduledProofAssignment[]): DoubleOptInVariance[] {
  const out: DoubleOptInVariance[] = [];
  for (const item of items) {
    const derived = newDoubleOptInVariance(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateDoubleOptInVariance(item: DoubleOptInVariance): string {
  return normalizeLenientProofAuditCode(item.code);
}
