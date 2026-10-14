import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictModelAdjustmentView, toStrictModelAdjustmentViews } from "./strict-model-adjustment-view.js";
import { newStrictModelAdjustment } from "./strict-model-adjustment.js";

test("StrictModelAdjustmentView shows the status in capitals", () => {
  const item = newStrictModelAdjustment("code-734", "name-576");
  const view = toStrictModelAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictModelAdjustmentViews([item, item]).length, 2, "views");
});
