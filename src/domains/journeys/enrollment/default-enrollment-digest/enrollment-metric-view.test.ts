import assert from "node:assert/strict";
import { test } from "node:test";
import { toEnrollmentMetricView, toEnrollmentMetricViews } from "./enrollment-metric-view.js";
import { newEnrollmentMetric } from "./enrollment-metric.js";

test("EnrollmentMetricView shows the status in capitals", () => {
  const item = newEnrollmentMetric("code-455", "name-72");
  const view = toEnrollmentMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toEnrollmentMetricViews([item, item]).length, 2, "views");
});
