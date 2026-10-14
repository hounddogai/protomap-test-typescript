import { SlaBaseline } from "../../sla/reservation/sla-baseline.js";
import { normalizeSlaReservationCode } from "../../sla/reservation/sla-reservation-policy.js";
import { DeflectionBudget, newDeflectionBudget } from "./deflection-budget.js";

export function summarizeSlaBaselinesForBudget(items: SlaBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveDeflectionBudgetsFromBaseline(items: SlaBaseline[]): DeflectionBudget[] {
  const out: DeflectionBudget[] = [];
  for (const item of items) {
    const derived = newDeflectionBudget(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function assignDeflectionBudget(item: DeflectionBudget): string {
  return normalizeSlaReservationCode(item.code);
}
