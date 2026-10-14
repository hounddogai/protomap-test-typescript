import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryTierMetricView, toPrimaryTierMetricViews } from "./primary-tier-metric-view.js";
import { newPrimaryTierMetric } from "./primary-tier-metric.js";

test("PrimaryTierMetricView shows the status in capitals", () => {
  const item = newPrimaryTierMetric("code-361", "name-973");
  const view = toPrimaryTierMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryTierMetricViews([item, item]).length, 2, "views");
});
