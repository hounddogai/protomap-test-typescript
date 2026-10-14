import { normalizeRegionalSenderBatchCode } from "../../sender/sender-rollup/regional-sender-batch-policy.js";
import { RegionalSenderBatch } from "../../sender/sender-rollup/regional-sender-batch.js";
import { ReputationAudit, newReputationAudit } from "./reputation-audit.js";

export function summarizeRegionalSenderBatchesForAudit(items: RegionalSenderBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveReputationAuditsFromBatch(items: RegionalSenderBatch[]): ReputationAudit[] {
  const out: ReputationAudit[] = [];
  for (const item of items) {
    const derived = newReputationAudit(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitReputationAudit(item: ReputationAudit): string {
  return normalizeRegionalSenderBatchCode(item.code);
}
