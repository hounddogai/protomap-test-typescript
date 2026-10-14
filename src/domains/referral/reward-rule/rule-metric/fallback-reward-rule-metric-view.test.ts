import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toFallbackRewardRuleMetricView,
  toFallbackRewardRuleMetricViews,
} from "./fallback-reward-rule-metric-view.js";
import { newFallbackRewardRuleMetric } from "./fallback-reward-rule-metric.js";

test("FallbackRewardRuleMetricView shows the status in capitals", () => {
  const item = newFallbackRewardRuleMetric("code-2", "name-592");
  const view = toFallbackRewardRuleMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackRewardRuleMetricViews([item, item]).length, 2, "views");
});
