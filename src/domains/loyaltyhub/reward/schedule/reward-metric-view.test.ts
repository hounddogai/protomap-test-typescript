import assert from "node:assert/strict";
import { test } from "node:test";
import { toRewardMetricView, toRewardMetricViews } from "./reward-metric-view.js";
import { newRewardMetric } from "./reward-metric.js";

test("RewardMetricView shows the status in capitals", () => {
  const item = newRewardMetric("code-832", "title-935");
  const view = toRewardMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRewardMetricViews([item, item]).length, 2, "views");
});
