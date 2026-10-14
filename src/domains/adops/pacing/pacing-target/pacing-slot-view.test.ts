import assert from "node:assert/strict";
import { test } from "node:test";
import { toPacingSlotView, toPacingSlotViews } from "./pacing-slot-view.js";
import { newPacingSlot } from "./pacing-slot.js";

test("PacingSlotView shows the status in capitals", () => {
  const item = newPacingSlot("code-903", "label-233");
  const view = toPacingSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPacingSlotViews([item, item]).length, 2, "views");
});
