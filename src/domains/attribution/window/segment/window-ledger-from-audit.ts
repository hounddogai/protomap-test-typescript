import { seasonalWindowAuditWeight } from "../reservation/seasonal-window-audit-policy.js";
import { SeasonalWindowAudit } from "../reservation/seasonal-window-audit.js";
import { WindowLedger, newWindowLedger } from "./window-ledger.js";

export function summarizeSeasonalWindowAuditsForLedger(items: SeasonalWindowAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveWindowLedgersFromAudit(items: SeasonalWindowAudit[]): WindowLedger[] {
  const out: WindowLedger[] = [];
  for (const item of items) {
    const derived = newWindowLedger(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeWindowLedger(item: WindowLedger): number {
  return seasonalWindowAuditWeight(3, true);
}
