import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedRetentionSlotView, toWeightedRetentionSlotViews } from "./weighted-retention-slot-view.js";
import { newWeightedRetentionSlot } from "./weighted-retention-slot.js";

test("WeightedRetentionSlotView shows the status in capitals", () => {
  const item = newWeightedRetentionSlot("code-412", "label-784");
  const view = toWeightedRetentionSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedRetentionSlotViews([item, item]).length, 2, "views");
});
