import assert from "node:assert/strict";
import { test } from "node:test";
import { toJourneyAdjustmentView, toJourneyAdjustmentViews } from "./journey-adjustment-view.js";
import { newJourneyAdjustment } from "./journey-adjustment.js";

test("JourneyAdjustmentView shows the status in capitals", () => {
  const item = newJourneyAdjustment("code-842", "title-438");
  const view = toJourneyAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toJourneyAdjustmentViews([item, item]).length, 2, "views");
});
