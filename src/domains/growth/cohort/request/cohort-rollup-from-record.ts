import { normalizeCohortOverrideCode } from "../record-item/cohort-override-policy.js";
import { CohortRecord } from "../record-item/cohort-record.js";
import { CohortRollup, newCohortRollup } from "./cohort-rollup.js";

export function summarizeCohortRecordsForRollup(items: CohortRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveCohortRollupsFromRecord(items: CohortRecord[]): CohortRollup[] {
  const out: CohortRollup[] = [];
  for (const item of items) {
    const derived = newCohortRollup(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveCohortRollup(item: CohortRollup): string {
  return normalizeCohortOverrideCode(item.code);
}
