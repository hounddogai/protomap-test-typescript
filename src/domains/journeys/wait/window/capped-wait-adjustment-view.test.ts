import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedWaitAdjustmentView, toCappedWaitAdjustmentViews } from "./capped-wait-adjustment-view.js";
import { newCappedWaitAdjustment } from "./capped-wait-adjustment.js";

test("CappedWaitAdjustmentView shows the status in capitals", () => {
  const item = newCappedWaitAdjustment("code-817", "title-130");
  const view = toCappedWaitAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedWaitAdjustmentViews([item, item]).length, 2, "views");
});
