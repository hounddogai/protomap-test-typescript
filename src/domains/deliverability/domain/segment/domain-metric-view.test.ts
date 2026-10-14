import assert from "node:assert/strict";
import { test } from "node:test";
import { toDomainMetricView, toDomainMetricViews } from "./domain-metric-view.js";
import { newDomainMetric } from "./domain-metric.js";

test("DomainMetricView shows the status in capitals", () => {
  const item = newDomainMetric("code-137", "label-335");
  const view = toDomainMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDomainMetricViews([item, item]).length, 2, "views");
});
