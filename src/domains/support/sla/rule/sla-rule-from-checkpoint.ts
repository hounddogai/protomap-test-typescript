import { CappedTicketViewCheckpoint } from "../../ticket-view/target/capped-ticket-view-checkpoint.js";
import { normalizeTicketViewMappingCode } from "../../ticket-view/target/ticket-view-mapping-policy.js";
import { SlaRule, newSlaRule } from "./sla-rule.js";

export function summarizeCappedTicketViewCheckpointsForRule(items: CappedTicketViewCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveSlaRulesFromCheckpoint(items: CappedTicketViewCheckpoint[]): SlaRule[] {
  const out: SlaRule[] = [];
  for (const item of items) {
    const derived = newSlaRule(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveSlaRule(item: SlaRule): string {
  return normalizeTicketViewMappingCode(item.code);
}
