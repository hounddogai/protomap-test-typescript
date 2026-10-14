import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toLenientSuppressionThresholdView,
  toLenientSuppressionThresholdViews,
} from "./lenient-suppression-threshold-view.js";
import { newLenientSuppressionThreshold } from "./lenient-suppression-threshold.js";

test("LenientSuppressionThresholdView shows the status in capitals", () => {
  const item = newLenientSuppressionThreshold("code-258", "name-137");
  const view = toLenientSuppressionThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientSuppressionThresholdViews([item, item]).length, 2, "views");
});
