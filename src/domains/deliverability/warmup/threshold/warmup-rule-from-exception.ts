import { classifyComplaintCycle } from "../../complaint/cycle/complaint-cycle-policy.js";
import { ComplaintException } from "../../complaint/cycle/complaint-exception.js";
import { WarmupRule, newWarmupRule } from "./warmup-rule.js";

export function summarizeComplaintExceptionsForRule(items: ComplaintException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveWarmupRulesFromException(items: ComplaintException[]): WarmupRule[] {
  const out: WarmupRule[] = [];
  for (const item of items) {
    const derived = newWarmupRule(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function splitWarmupRule(item: WarmupRule): string {
  return classifyComplaintCycle(item.adjustedVolume());
}
