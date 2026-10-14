import assert from "node:assert/strict";
import { test } from "node:test";
import { toActivationSlotView, toActivationSlotViews } from "./activation-slot-view.js";
import { newActivationSlot } from "./activation-slot.js";

test("ActivationSlotView shows the status in capitals", () => {
  const item = newActivationSlot("code-697", "name-444");
  const view = toActivationSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toActivationSlotViews([item, item]).length, 2, "views");
});
