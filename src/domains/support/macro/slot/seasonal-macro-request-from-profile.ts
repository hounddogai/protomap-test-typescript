import { primarySlaTargetBucket } from "../../sla/preference/primary-sla-target-policy.js";
import { SlaProfile } from "../../sla/preference/sla-profile.js";
import { SeasonalMacroRequest, newSeasonalMacroRequest } from "./seasonal-macro-request.js";

export function summarizeSlaProfilesForRequest(items: SlaProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveSeasonalMacroRequestsFromProfile(items: SlaProfile[]): SeasonalMacroRequest[] {
  const out: SeasonalMacroRequest[] = [];
  for (const item of items) {
    const derived = newSeasonalMacroRequest(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function computeSeasonalMacroRequest(item: SeasonalMacroRequest): string {
  return primarySlaTargetBucket(item.measuredValue());
}
