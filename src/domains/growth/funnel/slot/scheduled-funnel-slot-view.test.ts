import assert from "node:assert/strict";
import { test } from "node:test";
import { toScheduledFunnelSlotView, toScheduledFunnelSlotViews } from "./scheduled-funnel-slot-view.js";
import { newScheduledFunnelSlot } from "./scheduled-funnel-slot.js";

test("ScheduledFunnelSlotView shows the status in capitals", () => {
  const item = newScheduledFunnelSlot("code-933", "title-517");
  const view = toScheduledFunnelSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledFunnelSlotViews([item, item]).length, 2, "views");
});
