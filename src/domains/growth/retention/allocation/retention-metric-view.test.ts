import assert from "node:assert/strict";
import { test } from "node:test";
import { toRetentionMetricView, toRetentionMetricViews } from "./retention-metric-view.js";
import { newRetentionMetric } from "./retention-metric.js";

test("RetentionMetricView shows the status in capitals", () => {
  const item = newRetentionMetric("code-852", "name-127");
  const view = toRetentionMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRetentionMetricViews([item, item]).length, 2, "views");
});
