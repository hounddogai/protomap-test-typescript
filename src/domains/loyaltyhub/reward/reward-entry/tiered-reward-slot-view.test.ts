import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredRewardSlotView, toTieredRewardSlotViews } from "./tiered-reward-slot-view.js";
import { newTieredRewardSlot } from "./tiered-reward-slot.js";

test("TieredRewardSlotView shows the status in capitals", () => {
  const item = newTieredRewardSlot("code-866", "name-401");
  const view = toTieredRewardSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredRewardSlotViews([item, item]).length, 2, "views");
});
