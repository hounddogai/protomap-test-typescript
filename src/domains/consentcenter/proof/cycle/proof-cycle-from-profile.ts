import { normalizeSuppressionProfileCode } from "../../suppression/profile/suppression-profile-policy.js";
import { SuppressionProfile } from "../../suppression/profile/suppression-profile.js";
import { ProofCycle, newProofCycle } from "./proof-cycle.js";

export function summarizeSuppressionProfilesForCycle(items: SuppressionProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveProofCyclesFromProfile(items: SuppressionProfile[]): ProofCycle[] {
  const out: ProofCycle[] = [];
  for (const item of items) {
    const derived = newProofCycle(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyProofCycleExtra(item: ProofCycle): string {
  return normalizeSuppressionProfileCode(item.code);
}
