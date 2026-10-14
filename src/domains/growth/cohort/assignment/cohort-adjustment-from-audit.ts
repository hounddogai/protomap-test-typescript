import { retentionAuditBucket } from "../../retention/audit/retention-audit-policy.js";
import { RetentionAudit } from "../../retention/audit/retention-audit.js";
import { CohortAdjustment, newCohortAdjustment } from "./cohort-adjustment.js";

export function summarizeRetentionAuditsForAdjustment(items: RetentionAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveCohortAdjustmentsFromAudit(items: RetentionAudit[]): CohortAdjustment[] {
  const out: CohortAdjustment[] = [];
  for (const item of items) {
    const derived = newCohortAdjustment(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function matchCohortAdjustment(item: CohortAdjustment): string {
  return retentionAuditBucket(item.weightedLoad());
}
