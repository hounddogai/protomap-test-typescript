import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedExitRuleMetricView, toBatchedExitRuleMetricViews } from "./batched-exit-rule-metric-view.js";
import { newBatchedExitRuleMetric } from "./batched-exit-rule-metric.js";

test("BatchedExitRuleMetricView shows the status in capitals", () => {
  const item = newBatchedExitRuleMetric("code-96", "title-63");
  const view = toBatchedExitRuleMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedExitRuleMetricViews([item, item]).length, 2, "views");
});
