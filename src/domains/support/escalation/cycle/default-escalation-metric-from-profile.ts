import { normalizeDeflectionProfileCode } from "../../deflection/budget/deflection-profile-policy.js";
import { DeflectionProfile } from "../../deflection/budget/deflection-profile.js";
import { DefaultEscalationMetric, newDefaultEscalationMetric } from "./default-escalation-metric.js";

export function summarizeDeflectionProfilesForMetric(items: DeflectionProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveDefaultEscalationMetricsFromProfile(items: DeflectionProfile[]): DefaultEscalationMetric[] {
  const out: DefaultEscalationMetric[] = [];
  for (const item of items) {
    const derived = newDefaultEscalationMetric(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeDefaultEscalationMetric(item: DefaultEscalationMetric): string {
  return normalizeDeflectionProfileCode(item.code);
}
