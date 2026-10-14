import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveCsatThresholdView, toAdaptiveCsatThresholdViews } from "./adaptive-csat-threshold-view.js";
import { newAdaptiveCsatThreshold } from "./adaptive-csat-threshold.js";

test("AdaptiveCsatThresholdView shows the status in capitals", () => {
  const item = newAdaptiveCsatThreshold("code-826", "label-374");
  const view = toAdaptiveCsatThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveCsatThresholdViews([item, item]).length, 2, "views");
});
