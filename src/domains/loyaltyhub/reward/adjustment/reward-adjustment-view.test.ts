import assert from "node:assert/strict";
import { test } from "node:test";
import { toRewardAdjustmentView, toRewardAdjustmentViews } from "./reward-adjustment-view.js";
import { newRewardAdjustment } from "./reward-adjustment.js";

test("RewardAdjustmentView shows the status in capitals", () => {
  const item = newRewardAdjustment("code-628", "name-844");
  const view = toRewardAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRewardAdjustmentViews([item, item]).length, 2, "views");
});
