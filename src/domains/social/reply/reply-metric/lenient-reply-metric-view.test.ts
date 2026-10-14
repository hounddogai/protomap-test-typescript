import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientReplyMetricView, toLenientReplyMetricViews } from "./lenient-reply-metric-view.js";
import { newLenientReplyMetric } from "./lenient-reply-metric.js";

test("LenientReplyMetricView shows the status in capitals", () => {
  const item = newLenientReplyMetric("code-630", "name-714");
  const view = toLenientReplyMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientReplyMetricViews([item, item]).length, 2, "views");
});
