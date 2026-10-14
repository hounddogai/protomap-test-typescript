import assert from "node:assert/strict";
import { test } from "node:test";
import { toComplaintSlotView, toComplaintSlotViews } from "./complaint-slot-view.js";
import { newComplaintSlot } from "./complaint-slot.js";

test("ComplaintSlotView shows the status in capitals", () => {
  const item = newComplaintSlot("code-923", "title-968");
  const view = toComplaintSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toComplaintSlotViews([item, item]).length, 2, "views");
});
