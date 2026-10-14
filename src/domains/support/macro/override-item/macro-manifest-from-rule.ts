import { TicketViewRule } from "../../ticket-view/rule/ticket-view-rule.js";
import {
  normalizeWeightedTicketViewExceptionCode,
} from "../../ticket-view/rule/weighted-ticket-view-exception-policy.js";
import { MacroManifest, newMacroManifest } from "./macro-manifest.js";

export function summarizeTicketViewRulesForManifest(items: TicketViewRule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveMacroManifestsFromRule(items: TicketViewRule[]): MacroManifest[] {
  const out: MacroManifest[] = [];
  for (const item of items) {
    const derived = newMacroManifest(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function applyMacroManifest(item: MacroManifest): string {
  return normalizeWeightedTicketViewExceptionCode(item.code);
}
