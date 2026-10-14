import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingJourneySummaryView, toRollingJourneySummaryViews } from "./rolling-journey-summary-view.js";
import { newRollingJourneySummary } from "./rolling-journey-summary.js";

test("RollingJourneySummaryView shows the status in capitals", () => {
  const item = newRollingJourneySummary("code-660", "name-622");
  const view = toRollingJourneySummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingJourneySummaryViews([item, item]).length, 2, "views");
});
