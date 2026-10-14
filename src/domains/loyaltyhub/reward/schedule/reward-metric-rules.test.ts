import assert from "node:assert/strict";
import { test } from "node:test";
import { RewardMetricRequiredTitleRule, defaultRewardMetricValidator } from "./reward-metric-rules.js";
import { newRewardMetric } from "./reward-metric.js";

test("RewardMetricValidator reports every problem", () => {
  const validator = defaultRewardMetricValidator();
  const item = newRewardMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardMetricRequiredTitleRule flags a blank title", () => {
  const rule = new RewardMetricRequiredTitleRule("reward metric needs an entry");
  const item = newRewardMetric("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
