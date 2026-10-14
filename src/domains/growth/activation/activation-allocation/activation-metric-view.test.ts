import assert from "node:assert/strict";
import { test } from "node:test";
import { toActivationMetricView, toActivationMetricViews } from "./activation-metric-view.js";
import { newActivationMetric } from "./activation-metric.js";

test("ActivationMetricView shows the status in capitals", () => {
  const item = newActivationMetric("code-693", "name-91");
  const view = toActivationMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toActivationMetricViews([item, item]).length, 2, "views");
});
