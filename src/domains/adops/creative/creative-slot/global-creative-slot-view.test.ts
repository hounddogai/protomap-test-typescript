import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalCreativeSlotView, toGlobalCreativeSlotViews } from "./global-creative-slot-view.js";
import { newGlobalCreativeSlot } from "./global-creative-slot.js";

test("GlobalCreativeSlotView shows the status in capitals", () => {
  const item = newGlobalCreativeSlot("code-823", "label-335");
  const view = toGlobalCreativeSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalCreativeSlotViews([item, item]).length, 2, "views");
});
