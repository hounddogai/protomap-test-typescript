import { OptOutSegment } from "../../opt-out/review/opt-out-segment.js";
import { normalizeWeightedOptOutProfileCode } from "../../opt-out/review/weighted-opt-out-profile-policy.js";
import { ProofSnapshot, newProofSnapshot } from "./proof-snapshot.js";

export function summarizeOptOutSegmentsForSnapshot(items: OptOutSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveProofSnapshotsFromSegment(items: OptOutSegment[]): ProofSnapshot[] {
  const out: ProofSnapshot[] = [];
  for (const item of items) {
    const derived = newProofSnapshot(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeProofSnapshot(item: ProofSnapshot): string {
  return normalizeWeightedOptOutProfileCode(item.code);
}
