import assert from "node:assert/strict";
import { test } from "node:test";
import { toRewardSlotView, toRewardSlotViews } from "./reward-slot-view.js";
import { newRewardSlot } from "./reward-slot.js";

test("RewardSlotView shows the status in capitals", () => {
  const item = newRewardSlot("code-803", "name-78");
  const view = toRewardSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRewardSlotViews([item, item]).length, 2, "views");
});
