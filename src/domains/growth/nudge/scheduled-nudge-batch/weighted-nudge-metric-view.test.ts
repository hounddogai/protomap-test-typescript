import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedNudgeMetricView, toWeightedNudgeMetricViews } from "./weighted-nudge-metric-view.js";
import { newWeightedNudgeMetric } from "./weighted-nudge-metric.js";

test("WeightedNudgeMetricView shows the status in capitals", () => {
  const item = newWeightedNudgeMetric("code-368", "name-629");
  const view = toWeightedNudgeMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedNudgeMetricViews([item, item]).length, 2, "views");
});
