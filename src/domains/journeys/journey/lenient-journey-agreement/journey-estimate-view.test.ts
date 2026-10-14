import assert from "node:assert/strict";
import { test } from "node:test";
import { toJourneyEstimateView, toJourneyEstimateViews } from "./journey-estimate-view.js";
import { newJourneyEstimate } from "./journey-estimate.js";

test("JourneyEstimateView shows the status in capitals", () => {
  const item = newJourneyEstimate("code-55", "label-156");
  const view = toJourneyEstimateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toJourneyEstimateViews([item, item]).length, 2, "views");
});
