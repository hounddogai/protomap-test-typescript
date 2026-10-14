import { journeyManifestWeight } from "../../journey/plan/journey-manifest-policy.js";
import { JourneyManifest } from "../../journey/plan/journey-manifest.js";
import { RollingStepClaim, newRollingStepClaim } from "./rolling-step-claim.js";

export function summarizeJourneyManifestsForClaim(items: JourneyManifest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveRollingStepClaimsFromManifest(items: JourneyManifest[]): RollingStepClaim[] {
  const out: RollingStepClaim[] = [];
  for (const item of items) {
    const derived = newRollingStepClaim(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveRollingStepClaim(item: RollingStepClaim): number {
  return journeyManifestWeight(5, true);
}
