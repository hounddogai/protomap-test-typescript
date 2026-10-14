import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingJourneySlotView, toRollingJourneySlotViews } from "./rolling-journey-slot-view.js";
import { newRollingJourneySlot } from "./rolling-journey-slot.js";

test("RollingJourneySlotView shows the status in capitals", () => {
  const item = newRollingJourneySlot("code-788", "label-858");
  const view = toRollingJourneySlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingJourneySlotViews([item, item]).length, 2, "views");
});
