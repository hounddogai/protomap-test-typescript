import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictWaitMetricView, toStrictWaitMetricViews } from "./strict-wait-metric-view.js";
import { newStrictWaitMetric } from "./strict-wait-metric.js";

test("StrictWaitMetricView shows the status in capitals", () => {
  const item = newStrictWaitMetric("code-795", "name-766");
  const view = toStrictWaitMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictWaitMetricViews([item, item]).length, 2, "views");
});
