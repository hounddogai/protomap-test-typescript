import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingPostSlotView, toRollingPostSlotViews } from "./rolling-post-slot-view.js";
import { newRollingPostSlot } from "./rolling-post-slot.js";

test("RollingPostSlotView shows the status in capitals", () => {
  const item = newRollingPostSlot("code-401", "name-449");
  const view = toRollingPostSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingPostSlotViews([item, item]).length, 2, "views");
});
