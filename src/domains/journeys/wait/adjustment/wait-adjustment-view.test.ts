import assert from "node:assert/strict";
import { test } from "node:test";
import { toWaitAdjustmentView, toWaitAdjustmentViews } from "./wait-adjustment-view.js";
import { newWaitAdjustment } from "./wait-adjustment.js";

test("WaitAdjustmentView shows the status in capitals", () => {
  const item = newWaitAdjustment("code-549", "name-798");
  const view = toWaitAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWaitAdjustmentViews([item, item]).length, 2, "views");
});
