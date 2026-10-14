import assert from "node:assert/strict";
import { test } from "node:test";
import { toJourneyThresholdView, toJourneyThresholdViews } from "./journey-threshold-view.js";
import { newJourneyThreshold } from "./journey-threshold.js";

test("JourneyThresholdView shows the status in capitals", () => {
  const item = newJourneyThreshold("code-104", "label-764");
  const view = toJourneyThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toJourneyThresholdViews([item, item]).length, 2, "views");
});
