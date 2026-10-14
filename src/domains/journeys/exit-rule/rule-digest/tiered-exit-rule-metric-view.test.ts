import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredExitRuleMetricView, toTieredExitRuleMetricViews } from "./tiered-exit-rule-metric-view.js";
import { newTieredExitRuleMetric } from "./tiered-exit-rule-metric.js";

test("TieredExitRuleMetricView shows the status in capitals", () => {
  const item = newTieredExitRuleMetric("code-896", "title-379");
  const view = toTieredExitRuleMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredExitRuleMetricViews([item, item]).length, 2, "views");
});
