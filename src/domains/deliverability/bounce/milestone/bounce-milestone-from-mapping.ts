import {
  classifyLenientReputationAssignment,
} from "../../reputation/exception/lenient-reputation-assignment-policy.js";
import { ReputationMapping } from "../../reputation/exception/reputation-mapping.js";
import { BounceMilestone, newBounceMilestone } from "./bounce-milestone.js";

export function summarizeReputationMappingsForMilestone(items: ReputationMapping[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveBounceMilestonesFromMapping(items: ReputationMapping[]): BounceMilestone[] {
  const out: BounceMilestone[] = [];
  for (const item of items) {
    const derived = newBounceMilestone(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function splitBounceMilestone(item: BounceMilestone): string {
  return classifyLenientReputationAssignment(item.adjustedValue());
}
