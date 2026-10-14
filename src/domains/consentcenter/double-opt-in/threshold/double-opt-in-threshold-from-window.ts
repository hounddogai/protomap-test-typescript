import { normalizeProofVarianceCode } from "../../proof/window/proof-variance-policy.js";
import { ProofWindow } from "../../proof/window/proof-window.js";
import { DoubleOptInThreshold, newDoubleOptInThreshold } from "./double-opt-in-threshold.js";

export function summarizeProofWindowsForThreshold(items: ProofWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveDoubleOptInThresholdsFromWindow(items: ProofWindow[]): DoubleOptInThreshold[] {
  const out: DoubleOptInThreshold[] = [];
  for (const item of items) {
    const derived = newDoubleOptInThreshold(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveDoubleOptInThreshold(item: DoubleOptInThreshold): string {
  return normalizeProofVarianceCode(item.code);
}
