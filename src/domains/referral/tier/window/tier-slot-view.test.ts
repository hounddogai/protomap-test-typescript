import assert from "node:assert/strict";
import { test } from "node:test";
import { toTierSlotView, toTierSlotViews } from "./tier-slot-view.js";
import { newTierSlot } from "./tier-slot.js";

test("TierSlotView shows the status in capitals", () => {
  const item = newTierSlot("code-707", "label-532");
  const view = toTierSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTierSlotViews([item, item]).length, 2, "views");
});
