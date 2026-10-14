import { defaultEscalationMetricWeight } from "../../escalation/cycle/default-escalation-metric-policy.js";
import { EscalationCycle } from "../../escalation/cycle/escalation-cycle.js";
import { FallbackSlaTemplate, newFallbackSlaTemplate } from "./fallback-sla-template.js";

export function summarizeEscalationCyclesForTemplate(items: EscalationCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveFallbackSlaTemplatesFromCycle(items: EscalationCycle[]): FallbackSlaTemplate[] {
  const out: FallbackSlaTemplate[] = [];
  for (const item of items) {
    const derived = newFallbackSlaTemplate(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateFallbackSlaTemplate(item: FallbackSlaTemplate): number {
  return defaultEscalationMetricWeight(9, true);
}
