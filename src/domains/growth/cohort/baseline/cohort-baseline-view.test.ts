import assert from "node:assert/strict";
import { test } from "node:test";
import { toCohortBaselineView, toCohortBaselineViews } from "./cohort-baseline-view.js";
import { newCohortBaseline } from "./cohort-baseline.js";

test("CohortBaselineView shows the status in capitals", () => {
  const item = newCohortBaseline("code-472", "title-984");
  const view = toCohortBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCohortBaselineViews([item, item]).length, 2, "views");
});
