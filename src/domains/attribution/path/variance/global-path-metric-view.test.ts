import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalPathMetricView, toGlobalPathMetricViews } from "./global-path-metric-view.js";
import { newGlobalPathMetric } from "./global-path-metric.js";

test("GlobalPathMetricView shows the status in capitals", () => {
  const item = newGlobalPathMetric("code-410", "name-68");
  const view = toGlobalPathMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalPathMetricViews([item, item]).length, 2, "views");
});
