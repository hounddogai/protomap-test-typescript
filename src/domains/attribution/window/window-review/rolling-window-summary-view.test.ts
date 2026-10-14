import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingWindowSummaryView, toRollingWindowSummaryViews } from "./rolling-window-summary-view.js";
import { newRollingWindowSummary } from "./rolling-window-summary.js";

test("RollingWindowSummaryView shows the status in capitals", () => {
  const item = newRollingWindowSummary("code-151", "name-761");
  const view = toRollingWindowSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingWindowSummaryViews([item, item]).length, 2, "views");
});
