import assert from "node:assert/strict";
import { test } from "node:test";
import { toProofMetricView, toProofMetricViews } from "./proof-metric-view.js";
import { newProofMetric } from "./proof-metric.js";

test("ProofMetricView shows the status in capitals", () => {
  const item = newProofMetric("code-409", "label-468");
  const view = toProofMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toProofMetricViews([item, item]).length, 2, "views");
});
