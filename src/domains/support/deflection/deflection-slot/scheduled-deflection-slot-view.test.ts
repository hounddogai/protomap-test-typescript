import assert from "node:assert/strict";
import { test } from "node:test";
import { toScheduledDeflectionSlotView, toScheduledDeflectionSlotViews } from "./scheduled-deflection-slot-view.js";
import { newScheduledDeflectionSlot } from "./scheduled-deflection-slot.js";

test("ScheduledDeflectionSlotView shows the status in capitals", () => {
  const item = newScheduledDeflectionSlot("code-878", "name-707");
  const view = toScheduledDeflectionSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledDeflectionSlotViews([item, item]).length, 2, "views");
});
