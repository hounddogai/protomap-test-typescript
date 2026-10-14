import assert from "node:assert/strict";
import { test } from "node:test";
import { toDeflectionSlotView, toDeflectionSlotViews } from "./deflection-slot-view.js";
import { newDeflectionSlot } from "./deflection-slot.js";

test("DeflectionSlotView shows the status in capitals", () => {
  const item = newDeflectionSlot("code-281", "name-192");
  const view = toDeflectionSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDeflectionSlotViews([item, item]).length, 2, "views");
});
