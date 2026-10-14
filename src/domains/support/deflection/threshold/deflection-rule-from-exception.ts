import { normalizeSlaExceptionCode } from "../../sla/exception/sla-exception-policy.js";
import { SlaException } from "../../sla/exception/sla-exception.js";
import { DeflectionRule, newDeflectionRule } from "./deflection-rule.js";

export function summarizeSlaExceptionsForRule(items: SlaException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveDeflectionRulesFromException(items: SlaException[]): DeflectionRule[] {
  const out: DeflectionRule[] = [];
  for (const item of items) {
    const derived = newDeflectionRule(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergeDeflectionRule(item: DeflectionRule): string {
  return normalizeSlaExceptionCode(item.code);
}
