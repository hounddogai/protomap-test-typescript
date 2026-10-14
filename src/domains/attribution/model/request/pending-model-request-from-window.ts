import { LegacyTouchpointWindow } from "../../touchpoint/touchpoint-variance/legacy-touchpoint-window.js";
import {
  manualTouchpointAssignmentBucket,
} from "../../touchpoint/touchpoint-variance/manual-touchpoint-assignment-policy.js";
import { PendingModelRequest, newPendingModelRequest } from "./pending-model-request.js";

export function summarizeLegacyTouchpointWindowsForRequest(items: LegacyTouchpointWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function derivePendingModelRequestsFromWindow(items: LegacyTouchpointWindow[]): PendingModelRequest[] {
  const out: PendingModelRequest[] = [];
  for (const item of items) {
    const derived = newPendingModelRequest(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function applyPendingModelRequest(item: PendingModelRequest): string {
  return manualTouchpointAssignmentBucket(item.effectiveTotal());
}
