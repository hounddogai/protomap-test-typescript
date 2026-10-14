import {
  cappedDeflectionTemplateBucket,
} from "../../deflection/deflection-manifest/capped-deflection-template-policy.js";
import { DeflectionMapping } from "../../deflection/deflection-manifest/deflection-mapping.js";
import { TieredSlaMapping, newTieredSlaMapping } from "./tiered-sla-mapping.js";

export function summarizeDeflectionMappingsForMapping(items: DeflectionMapping[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveTieredSlaMappingsFromMapping(items: DeflectionMapping[]): TieredSlaMapping[] {
  const out: TieredSlaMapping[] = [];
  for (const item of items) {
    const derived = newTieredSlaMapping(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreTieredSlaMapping(item: TieredSlaMapping): string {
  return cappedDeflectionTemplateBucket(item.projectedTotal());
}
