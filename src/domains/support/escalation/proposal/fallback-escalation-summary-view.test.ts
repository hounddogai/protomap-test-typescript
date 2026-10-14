import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toFallbackEscalationSummaryView,
  toFallbackEscalationSummaryViews,
} from "./fallback-escalation-summary-view.js";
import { newFallbackEscalationSummary } from "./fallback-escalation-summary.js";

test("FallbackEscalationSummaryView shows the status in capitals", () => {
  const item = newFallbackEscalationSummary("code-299", "name-321");
  const view = toFallbackEscalationSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackEscalationSummaryViews([item, item]).length, 2, "views");
});
