import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultPathAdjustmentView, toDefaultPathAdjustmentViews } from "./default-path-adjustment-view.js";
import { newDefaultPathAdjustment } from "./default-path-adjustment.js";

test("DefaultPathAdjustmentView shows the status in capitals", () => {
  const item = newDefaultPathAdjustment("code-789", "title-175");
  const view = toDefaultPathAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultPathAdjustmentViews([item, item]).length, 2, "views");
});
