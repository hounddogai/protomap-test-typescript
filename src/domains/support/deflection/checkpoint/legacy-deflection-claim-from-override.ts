import { GlobalMacroOverride } from "../../macro/agreement/global-macro-override.js";
import { macroAgreementWeight } from "../../macro/agreement/macro-agreement-policy.js";
import { LegacyDeflectionClaim, newLegacyDeflectionClaim } from "./legacy-deflection-claim.js";

export function summarizeGlobalMacroOverridesForClaim(items: GlobalMacroOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveLegacyDeflectionClaimsFromOverride(items: GlobalMacroOverride[]): LegacyDeflectionClaim[] {
  const out: LegacyDeflectionClaim[] = [];
  for (const item of items) {
    const derived = newLegacyDeflectionClaim(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifyLegacyDeflectionClaimExtra(item: LegacyDeflectionClaim): number {
  return macroAgreementWeight(9, true);
}
