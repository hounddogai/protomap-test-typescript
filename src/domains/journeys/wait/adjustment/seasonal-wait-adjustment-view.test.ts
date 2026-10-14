import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalWaitAdjustmentView, toSeasonalWaitAdjustmentViews } from "./seasonal-wait-adjustment-view.js";
import { newSeasonalWaitAdjustment } from "./seasonal-wait-adjustment.js";

test("SeasonalWaitAdjustmentView shows the status in capitals", () => {
  const item = newSeasonalWaitAdjustment("code-134", "label-711");
  const view = toSeasonalWaitAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalWaitAdjustmentViews([item, item]).length, 2, "views");
});
