import { SeasonalWindowBundle } from "../../window/rule/seasonal-window-bundle.js";
import { normalizeWindowRuleCode } from "../../window/rule/window-rule-policy.js";
import { ModelException, newModelException } from "./model-exception.js";

export function summarizeSeasonalWindowBundlesForException(items: SeasonalWindowBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveModelExceptionsFromBundle(items: SeasonalWindowBundle[]): ModelException[] {
  const out: ModelException[] = [];
  for (const item of items) {
    const derived = newModelException(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeModelException(item: ModelException): string {
  return normalizeWindowRuleCode(item.code);
}
