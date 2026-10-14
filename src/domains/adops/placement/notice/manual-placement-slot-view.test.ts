import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualPlacementSlotView, toManualPlacementSlotViews } from "./manual-placement-slot-view.js";
import { newManualPlacementSlot } from "./manual-placement-slot.js";

test("ManualPlacementSlotView shows the status in capitals", () => {
  const item = newManualPlacementSlot("code-407", "name-716");
  const view = toManualPlacementSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualPlacementSlotViews([item, item]).length, 2, "views");
});
