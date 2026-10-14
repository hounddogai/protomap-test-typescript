import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackSenderMetricView, toFallbackSenderMetricViews } from "./fallback-sender-metric-view.js";
import { newFallbackSenderMetric } from "./fallback-sender-metric.js";

test("FallbackSenderMetricView shows the status in capitals", () => {
  const item = newFallbackSenderMetric("code-943", "label-375");
  const view = toFallbackSenderMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackSenderMetricViews([item, item]).length, 2, "views");
});
