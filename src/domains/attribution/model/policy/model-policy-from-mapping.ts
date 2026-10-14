import { TouchpointMapping } from "../../touchpoint/touchpoint-reservation/touchpoint-mapping.js";
import {
  normalizeTouchpointScheduleCode,
} from "../../touchpoint/touchpoint-reservation/touchpoint-schedule-policy.js";
import { ModelPolicy, newModelPolicy } from "./model-policy.js";

export function summarizeTouchpointMappingsForPolicy(items: TouchpointMapping[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveModelPoliciesFromMapping(items: TouchpointMapping[]): ModelPolicy[] {
  const out: ModelPolicy[] = [];
  for (const item of items) {
    const derived = newModelPolicy(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function rankModelPolicy(item: ModelPolicy): string {
  return normalizeTouchpointScheduleCode(item.code);
}
