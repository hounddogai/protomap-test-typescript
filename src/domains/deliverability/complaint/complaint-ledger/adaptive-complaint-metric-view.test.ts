import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveComplaintMetricView, toAdaptiveComplaintMetricViews } from "./adaptive-complaint-metric-view.js";
import { newAdaptiveComplaintMetric } from "./adaptive-complaint-metric.js";

test("AdaptiveComplaintMetricView shows the status in capitals", () => {
  const item = newAdaptiveComplaintMetric("code-261", "name-847");
  const view = toAdaptiveComplaintMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveComplaintMetricViews([item, item]).length, 2, "views");
});
