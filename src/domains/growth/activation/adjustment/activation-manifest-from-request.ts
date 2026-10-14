import { CohortRequest } from "../../cohort/request/cohort-request.js";
import { cohortRollupWeight } from "../../cohort/request/cohort-rollup-policy.js";
import { ActivationManifest, newActivationManifest } from "./activation-manifest.js";

export function summarizeCohortRequestsForManifest(items: CohortRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveActivationManifestsFromRequest(items: CohortRequest[]): ActivationManifest[] {
  const out: ActivationManifest[] = [];
  for (const item of items) {
    const derived = newActivationManifest(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeActivationManifest(item: ActivationManifest): number {
  return cohortRollupWeight(7, true);
}
