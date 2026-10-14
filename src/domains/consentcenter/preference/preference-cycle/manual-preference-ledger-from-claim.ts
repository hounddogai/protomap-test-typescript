import { normalizeCappedDoubleOptInSlotCode } from "../../double-opt-in/profile/capped-double-opt-in-slot-policy.js";
import { DoubleOptInClaim } from "../../double-opt-in/profile/double-opt-in-claim.js";
import { ManualPreferenceLedger, newManualPreferenceLedger } from "./manual-preference-ledger.js";

export function summarizeDoubleOptInClaimsForLedger(items: DoubleOptInClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveManualPreferenceLedgersFromClaim(items: DoubleOptInClaim[]): ManualPreferenceLedger[] {
  const out: ManualPreferenceLedger[] = [];
  for (const item of items) {
    const derived = newManualPreferenceLedger(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceManualPreferenceLedger(item: ManualPreferenceLedger): string {
  return normalizeCappedDoubleOptInSlotCode(item.code);
}
