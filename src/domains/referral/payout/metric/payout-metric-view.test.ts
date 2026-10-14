import assert from "node:assert/strict";
import { test } from "node:test";
import { toPayoutMetricView, toPayoutMetricViews } from "./payout-metric-view.js";
import { newPayoutMetric } from "./payout-metric.js";

test("PayoutMetricView shows the status in capitals", () => {
  const item = newPayoutMetric("code-185", "name-338");
  const view = toPayoutMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPayoutMetricViews([item, item]).length, 2, "views");
});
