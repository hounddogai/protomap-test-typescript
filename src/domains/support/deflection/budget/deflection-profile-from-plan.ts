import { PrimarySlaPlan } from "../../sla/policy/primary-sla-plan.js";
import { classifySlaPolicy } from "../../sla/policy/sla-policy-policy.js";
import { DeflectionProfile, newDeflectionProfile } from "./deflection-profile.js";

export function summarizePrimarySlaPlansForProfile(items: PrimarySlaPlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveDeflectionProfilesFromPlan(items: PrimarySlaPlan[]): DeflectionProfile[] {
  const out: DeflectionProfile[] = [];
  for (const item of items) {
    const derived = newDeflectionProfile(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function projectDeflectionProfile(item: DeflectionProfile): string {
  return classifySlaPolicy(item.projectedValue());
}
