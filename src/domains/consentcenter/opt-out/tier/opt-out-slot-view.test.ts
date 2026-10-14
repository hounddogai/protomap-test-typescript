import assert from "node:assert/strict";
import { test } from "node:test";
import { toOptOutSlotView, toOptOutSlotViews } from "./opt-out-slot-view.js";
import { newOptOutSlot } from "./opt-out-slot.js";

test("OptOutSlotView shows the status in capitals", () => {
  const item = newOptOutSlot("code-546", "title-997");
  const view = toOptOutSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toOptOutSlotViews([item, item]).length, 2, "views");
});
