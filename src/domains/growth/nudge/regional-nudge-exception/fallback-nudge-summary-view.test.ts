import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackNudgeSummaryView, toFallbackNudgeSummaryViews } from "./fallback-nudge-summary-view.js";
import { newFallbackNudgeSummary } from "./fallback-nudge-summary.js";

test("FallbackNudgeSummaryView shows the status in capitals", () => {
  const item = newFallbackNudgeSummary("code-642", "label-624");
  const view = toFallbackNudgeSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackNudgeSummaryViews([item, item]).length, 2, "views");
});
