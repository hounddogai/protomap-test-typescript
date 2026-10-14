import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredRewardMetricView, toTieredRewardMetricViews } from "./tiered-reward-metric-view.js";
import { newTieredRewardMetric } from "./tiered-reward-metric.js";

test("TieredRewardMetricView shows the status in capitals", () => {
  const item = newTieredRewardMetric("code-382", "label-716");
  const view = toTieredRewardMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredRewardMetricViews([item, item]).length, 2, "views");
});
