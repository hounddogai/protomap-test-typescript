import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveJourneyBaselineView, toAdaptiveJourneyBaselineViews } from "./adaptive-journey-baseline-view.js";
import { newAdaptiveJourneyBaseline } from "./adaptive-journey-baseline.js";

test("AdaptiveJourneyBaselineView shows the status in capitals", () => {
  const item = newAdaptiveJourneyBaseline("code-420", "label-5");
  const view = toAdaptiveJourneyBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveJourneyBaselineViews([item, item]).length, 2, "views");
});
