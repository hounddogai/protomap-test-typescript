import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyRewardSlotView, toLegacyRewardSlotViews } from "./legacy-reward-slot-view.js";
import { newLegacyRewardSlot } from "./legacy-reward-slot.js";

test("LegacyRewardSlotView shows the status in capitals", () => {
  const item = newLegacyRewardSlot("code-588", "name-828");
  const view = toLegacyRewardSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyRewardSlotViews([item, item]).length, 2, "views");
});
