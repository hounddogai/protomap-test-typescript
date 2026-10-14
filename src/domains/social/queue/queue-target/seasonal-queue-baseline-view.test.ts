import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalQueueBaselineView, toSeasonalQueueBaselineViews } from "./seasonal-queue-baseline-view.js";
import { newSeasonalQueueBaseline } from "./seasonal-queue-baseline.js";

test("SeasonalQueueBaselineView shows the status in capitals", () => {
  const item = newSeasonalQueueBaseline("code-4", "label-573");
  const view = toSeasonalQueueBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalQueueBaselineViews([item, item]).length, 2, "views");
});
