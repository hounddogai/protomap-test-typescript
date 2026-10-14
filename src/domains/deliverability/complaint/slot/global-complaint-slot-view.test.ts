import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalComplaintSlotView, toGlobalComplaintSlotViews } from "./global-complaint-slot-view.js";
import { newGlobalComplaintSlot } from "./global-complaint-slot.js";

test("GlobalComplaintSlotView shows the status in capitals", () => {
  const item = newGlobalComplaintSlot("code-971", "name-362");
  const view = toGlobalComplaintSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalComplaintSlotViews([item, item]).length, 2, "views");
});
