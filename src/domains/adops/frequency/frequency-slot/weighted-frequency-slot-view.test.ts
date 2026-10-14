import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedFrequencySlotView, toWeightedFrequencySlotViews } from "./weighted-frequency-slot-view.js";
import { newWeightedFrequencySlot } from "./weighted-frequency-slot.js";

test("WeightedFrequencySlotView shows the status in capitals", () => {
  const item = newWeightedFrequencySlot("code-513", "title-145");
  const view = toWeightedFrequencySlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedFrequencySlotViews([item, item]).length, 2, "views");
});
