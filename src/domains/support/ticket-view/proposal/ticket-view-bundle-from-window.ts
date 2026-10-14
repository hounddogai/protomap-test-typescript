import { EscalationWindow } from "../../escalation/manifest/escalation-window.js";
import {
  normalizeRollingEscalationMappingCode,
} from "../../escalation/manifest/rolling-escalation-mapping-policy.js";
import { TicketViewBundle, newTicketViewBundle } from "./ticket-view-bundle.js";

export function summarizeEscalationWindowsForBundle(items: EscalationWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveTicketViewBundlesFromWindow(items: EscalationWindow[]): TicketViewBundle[] {
  const out: TicketViewBundle[] = [];
  for (const item of items) {
    const derived = newTicketViewBundle(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignTicketViewBundle(item: TicketViewBundle): string {
  return normalizeRollingEscalationMappingCode(item.code);
}
