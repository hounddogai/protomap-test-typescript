import { normalizeModelAssignmentCode } from "../../model/assignment/model-assignment-policy.js";
import { ModelAssignment } from "../../model/assignment/model-assignment.js";
import { WindowPreference, newWindowPreference } from "./window-preference.js";

export function summarizeModelAssignmentsForPreference(items: ModelAssignment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveWindowPreferencesFromAssignment(items: ModelAssignment[]): WindowPreference[] {
  const out: WindowPreference[] = [];
  for (const item of items) {
    const derived = newWindowPreference(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateWindowPreference(item: WindowPreference): string {
  return normalizeModelAssignmentCode(item.code);
}
