import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedLevelAdjustmentView, toCappedLevelAdjustmentViews } from "./capped-level-adjustment-view.js";
import { newCappedLevelAdjustment } from "./capped-level-adjustment.js";

test("CappedLevelAdjustmentView shows the status in capitals", () => {
  const item = newCappedLevelAdjustment("code-832", "name-541");
  const view = toCappedLevelAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedLevelAdjustmentViews([item, item]).length, 2, "views");
});
