import { normalizeWaitAuditCode } from "../../wait/slot/wait-audit-policy.js";
import { WaitAudit } from "../../wait/slot/wait-audit.js";
import { RollingStepAssignment, newRollingStepAssignment } from "./rolling-step-assignment.js";

export function summarizeWaitAuditsForAssignment(items: WaitAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveRollingStepAssignmentsFromAudit(items: WaitAudit[]): RollingStepAssignment[] {
  const out: RollingStepAssignment[] = [];
  for (const item of items) {
    const derived = newRollingStepAssignment(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function applyRollingStepAssignment(item: RollingStepAssignment): string {
  return normalizeWaitAuditCode(item.code);
}
