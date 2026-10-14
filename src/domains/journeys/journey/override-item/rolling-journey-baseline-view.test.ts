import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingJourneyBaselineView, toRollingJourneyBaselineViews } from "./rolling-journey-baseline-view.js";
import { newRollingJourneyBaseline } from "./rolling-journey-baseline.js";

test("RollingJourneyBaselineView shows the status in capitals", () => {
  const item = newRollingJourneyBaseline("code-208", "title-987");
  const view = toRollingJourneyBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingJourneyBaselineViews([item, item]).length, 2, "views");
});
