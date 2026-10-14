import assert from "node:assert/strict";
import { test } from "node:test";
import { toWindowSummaryView, toWindowSummaryViews } from "./window-summary-view.js";
import { newWindowSummary } from "./window-summary.js";

test("WindowSummaryView shows the status in capitals", () => {
  const item = newWindowSummary("code-868", "label-107");
  const view = toWindowSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWindowSummaryViews([item, item]).length, 2, "views");
});
