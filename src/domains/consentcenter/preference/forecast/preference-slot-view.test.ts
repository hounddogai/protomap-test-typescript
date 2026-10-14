import assert from "node:assert/strict";
import { test } from "node:test";
import { toPreferenceSlotView, toPreferenceSlotViews } from "./preference-slot-view.js";
import { newPreferenceSlot } from "./preference-slot.js";

test("PreferenceSlotView shows the status in capitals", () => {
  const item = newPreferenceSlot("code-805", "name-398");
  const view = toPreferenceSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPreferenceSlotViews([item, item]).length, 2, "views");
});
