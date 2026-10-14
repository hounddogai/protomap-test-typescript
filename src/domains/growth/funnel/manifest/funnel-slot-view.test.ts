import assert from "node:assert/strict";
import { test } from "node:test";
import { toFunnelSlotView, toFunnelSlotViews } from "./funnel-slot-view.js";
import { newFunnelSlot } from "./funnel-slot.js";

test("FunnelSlotView shows the status in capitals", () => {
  const item = newFunnelSlot("code-43", "name-426");
  const view = toFunnelSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFunnelSlotViews([item, item]).length, 2, "views");
});
