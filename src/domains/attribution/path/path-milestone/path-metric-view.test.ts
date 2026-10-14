import assert from "node:assert/strict";
import { test } from "node:test";
import { toPathMetricView, toPathMetricViews } from "./path-metric-view.js";
import { newPathMetric } from "./path-metric.js";

test("PathMetricView shows the status in capitals", () => {
  const item = newPathMetric("code-340", "name-513");
  const view = toPathMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPathMetricViews([item, item]).length, 2, "views");
});
