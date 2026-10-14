import { normalizeBranchAuditCode } from "../../branch/slot/branch-audit-policy.js";
import { BranchSlot } from "../../branch/slot/branch-slot.js";
import { StepAssignment, newStepAssignment } from "./step-assignment.js";

export function summarizeBranchSlotsForAssignment(items: BranchSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveStepAssignmentsFromSlot(items: BranchSlot[]): StepAssignment[] {
  const out: StepAssignment[] = [];
  for (const item of items) {
    const derived = newStepAssignment(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateStepAssignment(item: StepAssignment): string {
  return normalizeBranchAuditCode(item.code);
}
