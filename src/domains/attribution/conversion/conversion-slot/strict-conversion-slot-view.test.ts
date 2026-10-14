import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictConversionSlotView, toStrictConversionSlotViews } from "./strict-conversion-slot-view.js";
import { newStrictConversionSlot } from "./strict-conversion-slot.js";

test("StrictConversionSlotView shows the status in capitals", () => {
  const item = newStrictConversionSlot("code-824", "title-621");
  const view = toStrictConversionSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictConversionSlotViews([item, item]).length, 2, "views");
});
