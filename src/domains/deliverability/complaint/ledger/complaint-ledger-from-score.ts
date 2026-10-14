import { pendingReputationCheckpointWeight } from "../../reputation/score/pending-reputation-checkpoint-policy.js";
import { RegionalReputationScore } from "../../reputation/score/regional-reputation-score.js";
import { ComplaintLedger, newComplaintLedger } from "./complaint-ledger.js";

export function summarizeRegionalReputationScoresForLedger(items: RegionalReputationScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveComplaintLedgersFromScore(items: RegionalReputationScore[]): ComplaintLedger[] {
  const out: ComplaintLedger[] = [];
  for (const item of items) {
    const derived = newComplaintLedger(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateComplaintLedger(item: ComplaintLedger): number {
  return pendingReputationCheckpointWeight(8, true);
}
