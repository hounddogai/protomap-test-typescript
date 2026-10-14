import { ProofBatch } from "../../proof/cycle/proof-batch.js";
import { proofCycleBucket } from "../../proof/cycle/proof-cycle-policy.js";
import { OptOutScore, newOptOutScore } from "./opt-out-score.js";

export function summarizeProofBatchesForScore(items: ProofBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveOptOutScoresFromBatch(items: ProofBatch[]): OptOutScore[] {
  const out: OptOutScore[] = [];
  for (const item of items) {
    const derived = newOptOutScore(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function scoreOptOutScore(item: OptOutScore): string {
  return proofCycleBucket(item.effectiveVolume());
}
