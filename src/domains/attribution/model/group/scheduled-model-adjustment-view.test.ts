import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toScheduledModelAdjustmentView,
  toScheduledModelAdjustmentViews,
} from "./scheduled-model-adjustment-view.js";
import { newScheduledModelAdjustment } from "./scheduled-model-adjustment.js";

test("ScheduledModelAdjustmentView shows the status in capitals", () => {
  const item = newScheduledModelAdjustment("code-272", "label-917");
  const view = toScheduledModelAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledModelAdjustmentViews([item, item]).length, 2, "views");
});
