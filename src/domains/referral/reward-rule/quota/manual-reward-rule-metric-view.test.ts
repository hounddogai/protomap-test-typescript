import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualRewardRuleMetricView, toManualRewardRuleMetricViews } from "./manual-reward-rule-metric-view.js";
import { newManualRewardRuleMetric } from "./manual-reward-rule-metric.js";

test("ManualRewardRuleMetricView shows the status in capitals", () => {
  const item = newManualRewardRuleMetric("code-58", "label-841");
  const view = toManualRewardRuleMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualRewardRuleMetricViews([item, item]).length, 2, "views");
});
