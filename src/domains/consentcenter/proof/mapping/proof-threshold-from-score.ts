import { LenientOptOutScore } from "../../opt-out/ledger/lenient-opt-out-score.js";
import { normalizeOptOutVarianceCode } from "../../opt-out/ledger/opt-out-variance-policy.js";
import { ProofThreshold, newProofThreshold } from "./proof-threshold.js";

export function summarizeLenientOptOutScoresForThreshold(items: LenientOptOutScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveProofThresholdsFromScore(items: LenientOptOutScore[]): ProofThreshold[] {
  const out: ProofThreshold[] = [];
  for (const item of items) {
    const derived = newProofThreshold(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifyProofThreshold(item: ProofThreshold): string {
  return normalizeOptOutVarianceCode(item.code);
}
