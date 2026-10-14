import assert from "node:assert/strict";
import { test } from "node:test";
import { toSlaMetricView, toSlaMetricViews } from "./sla-metric-view.js";
import { newSlaMetric } from "./sla-metric.js";

test("SlaMetricView shows the status in capitals", () => {
  const item = newSlaMetric("code-210", "label-724");
  const view = toSlaMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSlaMetricViews([item, item]).length, 2, "views");
});
