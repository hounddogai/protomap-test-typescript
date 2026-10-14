import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveFunnelSlotView, toAdaptiveFunnelSlotViews } from "./adaptive-funnel-slot-view.js";
import { newAdaptiveFunnelSlot } from "./adaptive-funnel-slot.js";

test("AdaptiveFunnelSlotView shows the status in capitals", () => {
  const item = newAdaptiveFunnelSlot("code-898", "title-564");
  const view = toAdaptiveFunnelSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveFunnelSlotViews([item, item]).length, 2, "views");
});
