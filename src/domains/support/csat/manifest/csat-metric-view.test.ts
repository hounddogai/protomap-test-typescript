import assert from "node:assert/strict";
import { test } from "node:test";
import { toCsatMetricView, toCsatMetricViews } from "./csat-metric-view.js";
import { newCsatMetric } from "./csat-metric.js";

test("CsatMetricView shows the status in capitals", () => {
  const item = newCsatMetric("code-674", "name-853");
  const view = toCsatMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCsatMetricViews([item, item]).length, 2, "views");
});
