import assert from "node:assert/strict";
import { test } from "node:test";
import { toSuppressionAdjustmentView, toSuppressionAdjustmentViews } from "./suppression-adjustment-view.js";
import { newSuppressionAdjustment } from "./suppression-adjustment.js";

test("SuppressionAdjustmentView shows the status in capitals", () => {
  const item = newSuppressionAdjustment("code-313", "title-391");
  const view = toSuppressionAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSuppressionAdjustmentViews([item, item]).length, 2, "views");
});
