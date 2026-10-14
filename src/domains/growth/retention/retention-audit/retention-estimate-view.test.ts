import assert from "node:assert/strict";
import { test } from "node:test";
import { toRetentionEstimateView, toRetentionEstimateViews } from "./retention-estimate-view.js";
import { newRetentionEstimate } from "./retention-estimate.js";

test("RetentionEstimateView shows the status in capitals", () => {
  const item = newRetentionEstimate("code-348", "label-907");
  const view = toRetentionEstimateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRetentionEstimateViews([item, item]).length, 2, "views");
});
