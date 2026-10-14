import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedPacingSlotView, toWeightedPacingSlotViews } from "./weighted-pacing-slot-view.js";
import { newWeightedPacingSlot } from "./weighted-pacing-slot.js";

test("WeightedPacingSlotView shows the status in capitals", () => {
  const item = newWeightedPacingSlot("code-375", "label-825");
  const view = toWeightedPacingSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedPacingSlotViews([item, item]).length, 2, "views");
});
