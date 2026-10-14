import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingCreativeSummaryView, toRollingCreativeSummaryViews } from "./rolling-creative-summary-view.js";
import { newRollingCreativeSummary } from "./rolling-creative-summary.js";

test("RollingCreativeSummaryView shows the status in capitals", () => {
  const item = newRollingCreativeSummary("code-813", "title-203");
  const view = toRollingCreativeSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingCreativeSummaryViews([item, item]).length, 2, "views");
});
