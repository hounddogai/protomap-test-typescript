import { DefaultProofWindow } from "../../proof/record-item/default-proof-window.js";
import { normalizeProofRollupCode } from "../../proof/record-item/proof-rollup-policy.js";
import { PrimaryOptOutClaim, newPrimaryOptOutClaim } from "./primary-opt-out-claim.js";

export function summarizeDefaultProofWindowsForClaim(items: DefaultProofWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function derivePrimaryOptOutClaimsFromWindow(items: DefaultProofWindow[]): PrimaryOptOutClaim[] {
  const out: PrimaryOptOutClaim[] = [];
  for (const item of items) {
    const derived = newPrimaryOptOutClaim(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function mergePrimaryOptOutClaim(item: PrimaryOptOutClaim): string {
  return normalizeProofRollupCode(item.code);
}
