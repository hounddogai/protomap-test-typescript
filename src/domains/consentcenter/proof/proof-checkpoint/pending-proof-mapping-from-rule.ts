import { DefaultOptOutRule } from "../../opt-out/rule/default-opt-out-rule.js";
import { classifyOptOutEntry } from "../../opt-out/rule/opt-out-entry-policy.js";
import { PendingProofMapping, newPendingProofMapping } from "./pending-proof-mapping.js";

export function summarizeDefaultOptOutRulesForMapping(items: DefaultOptOutRule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function derivePendingProofMappingsFromRule(items: DefaultOptOutRule[]): PendingProofMapping[] {
  const out: PendingProofMapping[] = [];
  for (const item of items) {
    const derived = newPendingProofMapping(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function settlePendingProofMapping(item: PendingProofMapping): string {
  return classifyOptOutEntry(item.netLoad());
}
