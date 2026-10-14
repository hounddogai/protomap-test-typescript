import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalPathAdjustmentView, toGlobalPathAdjustmentViews } from "./global-path-adjustment-view.js";
import { newGlobalPathAdjustment } from "./global-path-adjustment.js";

test("GlobalPathAdjustmentView shows the status in capitals", () => {
  const item = newGlobalPathAdjustment("code-259", "label-856");
  const view = toGlobalPathAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalPathAdjustmentViews([item, item]).length, 2, "views");
});
