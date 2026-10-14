import { classifyAdaptiveMacroPreference } from "../../macro/macro-baseline/adaptive-macro-preference-policy.js";
import { DefaultMacroBaseline } from "../../macro/macro-baseline/default-macro-baseline.js";
import { AdaptiveTicketViewClaim, newAdaptiveTicketViewClaim } from "./adaptive-ticket-view-claim.js";

export function summarizeDefaultMacroBaselinesForClaim(items: DefaultMacroBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveAdaptiveTicketViewClaimsFromBaseline(items: DefaultMacroBaseline[]): AdaptiveTicketViewClaim[] {
  const out: AdaptiveTicketViewClaim[] = [];
  for (const item of items) {
    const derived = newAdaptiveTicketViewClaim(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileAdaptiveTicketViewClaim(item: AdaptiveTicketViewClaim): string {
  return classifyAdaptiveMacroPreference(item.adjustedExposure());
}
