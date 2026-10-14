import assert from "node:assert/strict";
import { test } from "node:test";
import { toApprovalMetricView, toApprovalMetricViews } from "./approval-metric-view.js";
import { newApprovalMetric } from "./approval-metric.js";

test("ApprovalMetricView shows the status in capitals", () => {
  const item = newApprovalMetric("code-992", "label-844");
  const view = toApprovalMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toApprovalMetricViews([item, item]).length, 2, "views");
});
