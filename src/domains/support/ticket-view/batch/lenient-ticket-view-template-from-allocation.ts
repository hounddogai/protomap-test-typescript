import { fallbackMacroOverrideBucket } from "../../macro/mapping/fallback-macro-override-policy.js";
import { MacroAllocation } from "../../macro/mapping/macro-allocation.js";
import { LenientTicketViewTemplate, newLenientTicketViewTemplate } from "./lenient-ticket-view-template.js";

export function summarizeMacroAllocationsForTemplate(items: MacroAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveLenientTicketViewTemplatesFromAllocation(items: MacroAllocation[]): LenientTicketViewTemplate[] {
  const out: LenientTicketViewTemplate[] = [];
  for (const item of items) {
    const derived = newLenientTicketViewTemplate(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveLenientTicketViewTemplate(item: LenientTicketViewTemplate): string {
  return fallbackMacroOverrideBucket(item.projectedTotal());
}
