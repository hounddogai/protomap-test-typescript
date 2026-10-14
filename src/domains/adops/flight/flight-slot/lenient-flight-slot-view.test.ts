import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientFlightSlotView, toLenientFlightSlotViews } from "./lenient-flight-slot-view.js";
import { newLenientFlightSlot } from "./lenient-flight-slot.js";

test("LenientFlightSlotView shows the status in capitals", () => {
  const item = newLenientFlightSlot("code-775", "title-643");
  const view = toLenientFlightSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientFlightSlotViews([item, item]).length, 2, "views");
});
