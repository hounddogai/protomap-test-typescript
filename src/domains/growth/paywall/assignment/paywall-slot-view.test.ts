import assert from "node:assert/strict";
import { test } from "node:test";
import { toPaywallSlotView, toPaywallSlotViews } from "./paywall-slot-view.js";
import { newPaywallSlot } from "./paywall-slot.js";

test("PaywallSlotView shows the status in capitals", () => {
  const item = newPaywallSlot("code-732", "title-95");
  const view = toPaywallSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPaywallSlotViews([item, item]).length, 2, "views");
});
