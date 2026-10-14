import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualBounceThresholdView, toManualBounceThresholdViews } from "./manual-bounce-threshold-view.js";
import { newManualBounceThreshold } from "./manual-bounce-threshold.js";

test("ManualBounceThresholdView shows the status in capitals", () => {
  const item = newManualBounceThreshold("code-897", "name-689");
  const view = toManualBounceThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualBounceThresholdViews([item, item]).length, 2, "views");
});
