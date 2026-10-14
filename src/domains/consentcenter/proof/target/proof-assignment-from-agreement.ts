import { FallbackOptOutAgreement } from "../../opt-out/profile/fallback-opt-out-agreement.js";
import { optOutProfileWeight } from "../../opt-out/profile/opt-out-profile-policy.js";
import { ProofAssignment, newProofAssignment } from "./proof-assignment.js";

export function summarizeFallbackOptOutAgreementsForAssignment(items: FallbackOptOutAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveProofAssignmentsFromAgreement(items: FallbackOptOutAgreement[]): ProofAssignment[] {
  const out: ProofAssignment[] = [];
  for (const item of items) {
    const derived = newProofAssignment(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveProofAssignment(item: ProofAssignment): number {
  return optOutProfileWeight(1, true);
}
