import assert from "node:assert/strict";
import { test } from "node:test";
import { toInsightSummaryView, toInsightSummaryViews } from "./insight-summary-view.js";
import { newInsightSummary } from "./insight-summary.js";

test("InsightSummaryView shows the status in capitals", () => {
  const item = newInsightSummary("code-121", "label-195");
  const view = toInsightSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toInsightSummaryViews([item, item]).length, 2, "views");
});
