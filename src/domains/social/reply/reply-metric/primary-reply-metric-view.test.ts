import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryReplyMetricView, toPrimaryReplyMetricViews } from "./primary-reply-metric-view.js";
import { newPrimaryReplyMetric } from "./primary-reply-metric.js";

test("PrimaryReplyMetricView shows the status in capitals", () => {
  const item = newPrimaryReplyMetric("code-425", "label-928");
  const view = toPrimaryReplyMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryReplyMetricViews([item, item]).length, 2, "views");
});
