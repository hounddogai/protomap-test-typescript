import { manualPathAuditWeight } from "../../path/draft/manual-path-audit-policy.js";
import { ManualPathAudit } from "../../path/draft/manual-path-audit.js";
import { ModelAssignment, newModelAssignment } from "./model-assignment.js";

export function summarizeManualPathAuditsForAssignment(items: ManualPathAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveModelAssignmentsFromAudit(items: ManualPathAudit[]): ModelAssignment[] {
  const out: ModelAssignment[] = [];
  for (const item of items) {
    const derived = newModelAssignment(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizeModelAssignment(item: ModelAssignment): number {
  return manualPathAuditWeight(2, true);
}
