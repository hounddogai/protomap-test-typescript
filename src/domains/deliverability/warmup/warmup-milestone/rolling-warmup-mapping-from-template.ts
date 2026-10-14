import { defaultDomainTemplateBucket } from "../../domain/claim/default-domain-template-policy.js";
import { DefaultDomainTemplate } from "../../domain/claim/default-domain-template.js";
import { RollingWarmupMapping, newRollingWarmupMapping } from "./rolling-warmup-mapping.js";

export function summarizeDefaultDomainTemplatesForMapping(items: DefaultDomainTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveRollingWarmupMappingsFromTemplate(items: DefaultDomainTemplate[]): RollingWarmupMapping[] {
  const out: RollingWarmupMapping[] = [];
  for (const item of items) {
    const derived = newRollingWarmupMapping(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function computeRollingWarmupMapping(item: RollingWarmupMapping): string {
  return defaultDomainTemplateBucket(item.effectiveTotal());
}
