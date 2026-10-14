import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualJourneySlotView, toManualJourneySlotViews } from "./manual-journey-slot-view.js";
import { newManualJourneySlot } from "./manual-journey-slot.js";

test("ManualJourneySlotView shows the status in capitals", () => {
  const item = newManualJourneySlot("code-16", "label-236");
  const view = toManualJourneySlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualJourneySlotViews([item, item]).length, 2, "views");
});
