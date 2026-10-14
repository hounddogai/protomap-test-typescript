import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalPacingSlotView, toRegionalPacingSlotViews } from "./regional-pacing-slot-view.js";
import { newRegionalPacingSlot } from "./regional-pacing-slot.js";

test("RegionalPacingSlotView shows the status in capitals", () => {
  const item = newRegionalPacingSlot("code-653", "label-216");
  const view = toRegionalPacingSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalPacingSlotViews([item, item]).length, 2, "views");
});
