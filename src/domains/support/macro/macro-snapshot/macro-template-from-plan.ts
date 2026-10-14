import { classifyCappedTicketViewDigest } from "../../ticket-view/metric/capped-ticket-view-digest-policy.js";
import { TicketViewPlan } from "../../ticket-view/metric/ticket-view-plan.js";
import { MacroTemplate, newMacroTemplate } from "./macro-template.js";

export function summarizeTicketViewPlansForTemplate(items: TicketViewPlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveMacroTemplatesFromPlan(items: TicketViewPlan[]): MacroTemplate[] {
  const out: MacroTemplate[] = [];
  for (const item of items) {
    const derived = newMacroTemplate(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveMacroTemplate(item: MacroTemplate): string {
  return classifyCappedTicketViewDigest(item.weightedValue());
}
