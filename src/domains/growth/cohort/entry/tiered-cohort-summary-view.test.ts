import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredCohortSummaryView, toTieredCohortSummaryViews } from "./tiered-cohort-summary-view.js";
import { newTieredCohortSummary } from "./tiered-cohort-summary.js";

test("TieredCohortSummaryView shows the status in capitals", () => {
  const item = newTieredCohortSummary("code-276", "title-463");
  const view = toTieredCohortSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredCohortSummaryViews([item, item]).length, 2, "views");
});
