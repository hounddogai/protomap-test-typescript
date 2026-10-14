import { normalizeGlobalCsatTemplateCode } from "../../csat/rule/global-csat-template-policy.js";
import { WeightedCsatRule } from "../../csat/rule/weighted-csat-rule.js";
import { TicketViewBundle, newTicketViewBundle } from "./ticket-view-bundle.js";

export function summarizeWeightedCsatRulesForBundle(items: WeightedCsatRule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveTicketViewBundlesFromRule(items: WeightedCsatRule[]): TicketViewBundle[] {
  const out: TicketViewBundle[] = [];
  for (const item of items) {
    const derived = newTicketViewBundle(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveTicketViewBundle(item: TicketViewBundle): string {
  return normalizeGlobalCsatTemplateCode(item.code);
}
