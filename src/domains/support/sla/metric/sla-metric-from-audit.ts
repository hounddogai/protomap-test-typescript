import { MacroAudit } from "../../macro/adaptive-macro-record/macro-audit.js";
import { classifyRollingMacroRecord } from "../../macro/adaptive-macro-record/rolling-macro-record-policy.js";
import { SlaMetric, newSlaMetric } from "./sla-metric.js";

export function summarizeMacroAuditsForMetric(items: MacroAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveSlaMetricsFromAudit(items: MacroAudit[]): SlaMetric[] {
  const out: SlaMetric[] = [];
  for (const item of items) {
    const derived = newSlaMetric(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifySlaMetric(item: SlaMetric): string {
  return classifyRollingMacroRecord(item.weightedLoad());
}
