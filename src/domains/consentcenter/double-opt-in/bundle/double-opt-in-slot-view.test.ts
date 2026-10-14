import assert from "node:assert/strict";
import { test } from "node:test";
import { toDoubleOptInSlotView, toDoubleOptInSlotViews } from "./double-opt-in-slot-view.js";
import { newDoubleOptInSlot } from "./double-opt-in-slot.js";

test("DoubleOptInSlotView shows the status in capitals", () => {
  const item = newDoubleOptInSlot("code-783", "label-113");
  const view = toDoubleOptInSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDoubleOptInSlotViews([item, item]).length, 2, "views");
});
