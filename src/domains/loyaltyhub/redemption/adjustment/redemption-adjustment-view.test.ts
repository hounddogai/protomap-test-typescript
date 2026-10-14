import assert from "node:assert/strict";
import { test } from "node:test";
import { toRedemptionAdjustmentView, toRedemptionAdjustmentViews } from "./redemption-adjustment-view.js";
import { newRedemptionAdjustment } from "./redemption-adjustment.js";

test("RedemptionAdjustmentView shows the status in capitals", () => {
  const item = newRedemptionAdjustment("code-819", "name-22");
  const view = toRedemptionAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRedemptionAdjustmentViews([item, item]).length, 2, "views");
});
