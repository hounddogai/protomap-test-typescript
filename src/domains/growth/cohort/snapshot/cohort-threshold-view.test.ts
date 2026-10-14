import assert from "node:assert/strict";
import { test } from "node:test";
import { toCohortThresholdView, toCohortThresholdViews } from "./cohort-threshold-view.js";
import { newCohortThreshold } from "./cohort-threshold.js";

test("CohortThresholdView shows the status in capitals", () => {
  const item = newCohortThreshold("code-199", "label-4");
  const view = toCohortThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCohortThresholdViews([item, item]).length, 2, "views");
});
