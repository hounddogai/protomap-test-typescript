import assert from "node:assert/strict";
import { test } from "node:test";
import { toCohortMetricView, toCohortMetricViews } from "./cohort-metric-view.js";
import { newCohortMetric } from "./cohort-metric.js";

test("CohortMetricView shows the status in capitals", () => {
  const item = newCohortMetric("code-510", "title-862");
  const view = toCohortMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCohortMetricViews([item, item]).length, 2, "views");
});
