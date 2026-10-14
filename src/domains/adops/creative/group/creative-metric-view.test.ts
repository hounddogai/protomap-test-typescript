import assert from "node:assert/strict";
import { test } from "node:test";
import { toCreativeMetricView, toCreativeMetricViews } from "./creative-metric-view.js";
import { newCreativeMetric } from "./creative-metric.js";

test("CreativeMetricView shows the status in capitals", () => {
  const item = newCreativeMetric("code-911", "name-551");
  const view = toCreativeMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCreativeMetricViews([item, item]).length, 2, "views");
});
