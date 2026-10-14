import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultBadgeSlotView, toDefaultBadgeSlotViews } from "./default-badge-slot-view.js";
import { newDefaultBadgeSlot } from "./default-badge-slot.js";

test("DefaultBadgeSlotView shows the status in capitals", () => {
  const item = newDefaultBadgeSlot("code-894", "name-77");
  const view = toDefaultBadgeSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultBadgeSlotViews([item, item]).length, 2, "views");
});
