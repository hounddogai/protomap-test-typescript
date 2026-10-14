import assert from "node:assert/strict";
import { test } from "node:test";
import { toFrequencySlotView, toFrequencySlotViews } from "./frequency-slot-view.js";
import { newFrequencySlot } from "./frequency-slot.js";

test("FrequencySlotView shows the status in capitals", () => {
  const item = newFrequencySlot("code-820", "label-403");
  const view = toFrequencySlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFrequencySlotViews([item, item]).length, 2, "views");
});
