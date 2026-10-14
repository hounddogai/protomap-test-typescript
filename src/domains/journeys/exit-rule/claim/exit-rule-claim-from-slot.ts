import { normalizeWaitAuditCode } from "../../wait/slot/wait-audit-policy.js";
import { WaitSlot } from "../../wait/slot/wait-slot.js";
import { ExitRuleClaim, newExitRuleClaim } from "./exit-rule-claim.js";

export function summarizeWaitSlotsForClaim(items: WaitSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveExitRuleClaimsFromSlot(items: WaitSlot[]): ExitRuleClaim[] {
  const out: ExitRuleClaim[] = [];
  for (const item of items) {
    const derived = newExitRuleClaim(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergeExitRuleClaim(item: ExitRuleClaim): string {
  return normalizeWaitAuditCode(item.code);
}
