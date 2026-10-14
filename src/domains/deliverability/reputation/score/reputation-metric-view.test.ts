import assert from "node:assert/strict";
import { test } from "node:test";
import { toReputationMetricView, toReputationMetricViews } from "./reputation-metric-view.js";
import { newReputationMetric } from "./reputation-metric.js";

test("ReputationMetricView shows the status in capitals", () => {
  const item = newReputationMetric("code-547", "label-877");
  const view = toReputationMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toReputationMetricViews([item, item]).length, 2, "views");
});
