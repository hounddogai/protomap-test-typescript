import assert from "node:assert/strict";
import { test } from "node:test";
import { toTouchpointSummaryView, toTouchpointSummaryViews } from "./touchpoint-summary-view.js";
import { newTouchpointSummary } from "./touchpoint-summary.js";

test("TouchpointSummaryView shows the status in capitals", () => {
  const item = newTouchpointSummary("code-694", "label-137");
  const view = toTouchpointSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTouchpointSummaryViews([item, item]).length, 2, "views");
});
