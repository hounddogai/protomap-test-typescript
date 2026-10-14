import { classifyTieredSlaMapping } from "../../sla/sla-manifest/tiered-sla-mapping-policy.js";
import { TieredSlaMapping } from "../../sla/sla-manifest/tiered-sla-mapping.js";
import { LegacyDeflectionRule, newLegacyDeflectionRule } from "./legacy-deflection-rule.js";

export function summarizeTieredSlaMappingsForRule(items: TieredSlaMapping[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveLegacyDeflectionRulesFromMapping(items: TieredSlaMapping[]): LegacyDeflectionRule[] {
  const out: LegacyDeflectionRule[] = [];
  for (const item of items) {
    const derived = newLegacyDeflectionRule(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileLegacyDeflectionRule(item: LegacyDeflectionRule): string {
  return classifyTieredSlaMapping(item.netExposure());
}
