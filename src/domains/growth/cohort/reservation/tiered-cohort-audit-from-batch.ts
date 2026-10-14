import { adaptiveNudgePreferenceBucket } from "../../nudge/batch/adaptive-nudge-preference-policy.js";
import { NudgeBatch } from "../../nudge/batch/nudge-batch.js";
import { TieredCohortAudit, newTieredCohortAudit } from "./tiered-cohort-audit.js";

export function summarizeNudgeBatchesForAudit(items: NudgeBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveTieredCohortAuditsFromBatch(items: NudgeBatch[]): TieredCohortAudit[] {
  const out: TieredCohortAudit[] = [];
  for (const item of items) {
    const derived = newTieredCohortAudit(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveTieredCohortAudit(item: TieredCohortAudit): string {
  return adaptiveNudgePreferenceBucket(item.measuredValue());
}
