import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalPostAdjustmentView, toRegionalPostAdjustmentViews } from "./regional-post-adjustment-view.js";
import { newRegionalPostAdjustment } from "./regional-post-adjustment.js";

test("RegionalPostAdjustmentView shows the status in capitals", () => {
  const item = newRegionalPostAdjustment("code-129", "label-579");
  const view = toRegionalPostAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalPostAdjustmentViews([item, item]).length, 2, "views");
});
