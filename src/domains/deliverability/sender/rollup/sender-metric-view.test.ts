import assert from "node:assert/strict";
import { test } from "node:test";
import { toSenderMetricView, toSenderMetricViews } from "./sender-metric-view.js";
import { newSenderMetric } from "./sender-metric.js";

test("SenderMetricView shows the status in capitals", () => {
  const item = newSenderMetric("code-919", "title-864");
  const view = toSenderMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSenderMetricViews([item, item]).length, 2, "views");
});
