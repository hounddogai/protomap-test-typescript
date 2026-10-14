import assert from "node:assert/strict";
import { test } from "node:test";
import { toComplaintMetricView, toComplaintMetricViews } from "./complaint-metric-view.js";
import { newComplaintMetric } from "./complaint-metric.js";

test("ComplaintMetricView shows the status in capitals", () => {
  const item = newComplaintMetric("code-573", "name-746");
  const view = toComplaintMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toComplaintMetricViews([item, item]).length, 2, "views");
});
