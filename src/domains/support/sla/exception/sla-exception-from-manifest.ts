import { normalizeEscalationManifestCode } from "../../escalation/metric/escalation-manifest-policy.js";
import { EscalationManifest } from "../../escalation/metric/escalation-manifest.js";
import { SlaException, newSlaException } from "./sla-exception.js";

export function summarizeEscalationManifestsForException(items: EscalationManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveSlaExceptionsFromManifest(items: EscalationManifest[]): SlaException[] {
  const out: SlaException[] = [];
  for (const item of items) {
    const derived = newSlaException(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function splitSlaException(item: SlaException): string {
  return normalizeEscalationManifestCode(item.code);
}
