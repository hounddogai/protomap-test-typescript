import assert from "node:assert/strict";
import { test } from "node:test";
import { toRetentionAdjustmentView, toRetentionAdjustmentViews } from "./retention-adjustment-view.js";
import { newRetentionAdjustment } from "./retention-adjustment.js";

test("RetentionAdjustmentView shows the status in capitals", () => {
  const item = newRetentionAdjustment("code-922", "title-705");
  const view = toRetentionAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRetentionAdjustmentViews([item, item]).length, 2, "views");
});
