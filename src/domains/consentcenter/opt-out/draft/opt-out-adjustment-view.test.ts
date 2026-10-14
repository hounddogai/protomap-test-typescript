import assert from "node:assert/strict";
import { test } from "node:test";
import { toOptOutAdjustmentView, toOptOutAdjustmentViews } from "./opt-out-adjustment-view.js";
import { newOptOutAdjustment } from "./opt-out-adjustment.js";

test("OptOutAdjustmentView shows the status in capitals", () => {
  const item = newOptOutAdjustment("code-807", "name-694");
  const view = toOptOutAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toOptOutAdjustmentViews([item, item]).length, 2, "views");
});
