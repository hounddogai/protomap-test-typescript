import { modelScoreBucket } from "../mapping/model-score-policy.js";
import { ModelScore } from "../mapping/model-score.js";
import { ModelLedger, newModelLedger } from "./model-ledger.js";

export function summarizeModelScoresForLedger(items: ModelScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveModelLedgersFromScore(items: ModelScore[]): ModelLedger[] {
  const out: ModelLedger[] = [];
  for (const item of items) {
    const derived = newModelLedger(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizeModelLedger(item: ModelLedger): string {
  return modelScoreBucket(item.adjustedExposure());
}
