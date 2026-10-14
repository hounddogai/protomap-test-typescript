import { PendingRetentionAudit } from "../../retention/retention-audit/pending-retention-audit.js";
import { classifyRetentionEstimate } from "../../retention/retention-audit/retention-estimate-policy.js";
import { CohortCycle, newCohortCycle } from "./cohort-cycle.js";

export function summarizePendingRetentionAuditsForCycle(items: PendingRetentionAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveCohortCyclesFromAudit(items: PendingRetentionAudit[]): CohortCycle[] {
  const out: CohortCycle[] = [];
  for (const item of items) {
    const derived = newCohortCycle(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyCohortCycle(item: CohortCycle): string {
  return classifyRetentionEstimate(item.measuredValue());
}
