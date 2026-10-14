import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedActivationSlotView, toCappedActivationSlotViews } from "./capped-activation-slot-view.js";
import { newCappedActivationSlot } from "./capped-activation-slot.js";

test("CappedActivationSlotView shows the status in capitals", () => {
  const item = newCappedActivationSlot("code-624", "name-231");
  const view = toCappedActivationSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedActivationSlotViews([item, item]).length, 2, "views");
});
