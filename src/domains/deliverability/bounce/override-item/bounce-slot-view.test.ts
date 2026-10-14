import assert from "node:assert/strict";
import { test } from "node:test";
import { toBounceSlotView, toBounceSlotViews } from "./bounce-slot-view.js";
import { newBounceSlot } from "./bounce-slot.js";

test("BounceSlotView shows the status in capitals", () => {
  const item = newBounceSlot("code-224", "title-608");
  const view = toBounceSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBounceSlotViews([item, item]).length, 2, "views");
});
