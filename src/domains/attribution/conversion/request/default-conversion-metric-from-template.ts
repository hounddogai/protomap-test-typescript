import { pathTemplateWeight } from "../../path/claim/path-template-policy.js";
import { PathTemplate } from "../../path/claim/path-template.js";
import { DefaultConversionMetric, newDefaultConversionMetric } from "./default-conversion-metric.js";

export function summarizePathTemplatesForMetric(items: PathTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveDefaultConversionMetricsFromTemplate(items: PathTemplate[]): DefaultConversionMetric[] {
  const out: DefaultConversionMetric[] = [];
  for (const item of items) {
    const derived = newDefaultConversionMetric(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectDefaultConversionMetric(item: DefaultConversionMetric): number {
  return pathTemplateWeight(3, true);
}
