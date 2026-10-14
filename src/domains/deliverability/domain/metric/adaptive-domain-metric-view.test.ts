import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveDomainMetricView, toAdaptiveDomainMetricViews } from "./adaptive-domain-metric-view.js";
import { newAdaptiveDomainMetric } from "./adaptive-domain-metric.js";

test("AdaptiveDomainMetricView shows the status in capitals", () => {
  const item = newAdaptiveDomainMetric("code-144", "name-72");
  const view = toAdaptiveDomainMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveDomainMetricViews([item, item]).length, 2, "views");
});
