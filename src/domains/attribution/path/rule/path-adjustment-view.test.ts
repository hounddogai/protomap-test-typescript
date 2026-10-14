import assert from "node:assert/strict";
import { test } from "node:test";
import { toPathAdjustmentView, toPathAdjustmentViews } from "./path-adjustment-view.js";
import { newPathAdjustment } from "./path-adjustment.js";

test("PathAdjustmentView shows the status in capitals", () => {
  const item = newPathAdjustment("code-862", "label-611");
  const view = toPathAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPathAdjustmentViews([item, item]).length, 2, "views");
});
