import { ManualDoubleOptInDraft } from "../../double-opt-in/group/manual-double-opt-in-draft.js";
import {
  primaryDoubleOptInThresholdWeight,
} from "../../double-opt-in/group/primary-double-opt-in-threshold-policy.js";
import { LegacyProofClaim, newLegacyProofClaim } from "./legacy-proof-claim.js";

export function summarizeManualDoubleOptInDraftsForClaim(items: ManualDoubleOptInDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveLegacyProofClaimsFromDraft(items: ManualDoubleOptInDraft[]): LegacyProofClaim[] {
  const out: LegacyProofClaim[] = [];
  for (const item of items) {
    const derived = newLegacyProofClaim(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function matchLegacyProofClaim(item: LegacyProofClaim): number {
  return primaryDoubleOptInThresholdWeight(1, true);
}
