import assert from "node:assert/strict";
import { test } from "node:test";
import { toModelAdjustmentView, toModelAdjustmentViews } from "./model-adjustment-view.js";
import { newModelAdjustment } from "./model-adjustment.js";

test("ModelAdjustmentView shows the status in capitals", () => {
  const item = newModelAdjustment("code-708", "label-25");
  const view = toModelAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toModelAdjustmentViews([item, item]).length, 2, "views");
});
