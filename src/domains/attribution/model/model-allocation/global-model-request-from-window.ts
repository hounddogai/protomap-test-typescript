import { modelExceptionBucket } from "../allocation/model-exception-policy.js";
import { ModelWindow } from "../allocation/model-window.js";
import { GlobalModelRequest, newGlobalModelRequest } from "./global-model-request.js";

export function summarizeModelWindowsForRequest(items: ModelWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveGlobalModelRequestsFromWindow(items: ModelWindow[]): GlobalModelRequest[] {
  const out: GlobalModelRequest[] = [];
  for (const item of items) {
    const derived = newGlobalModelRequest(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveGlobalModelRequest(item: GlobalModelRequest): string {
  return modelExceptionBucket(item.adjustedLoad());
}
