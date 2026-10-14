import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedFrequencyMetricView, toBatchedFrequencyMetricViews } from "./batched-frequency-metric-view.js";
import { newBatchedFrequencyMetric } from "./batched-frequency-metric.js";

test("BatchedFrequencyMetricView shows the status in capitals", () => {
  const item = newBatchedFrequencyMetric("code-66", "label-124");
  const view = toBatchedFrequencyMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedFrequencyMetricViews([item, item]).length, 2, "views");
});
