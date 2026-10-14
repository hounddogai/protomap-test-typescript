import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveSlaThresholdView, toAdaptiveSlaThresholdViews } from "./adaptive-sla-threshold-view.js";
import { newAdaptiveSlaThreshold } from "./adaptive-sla-threshold.js";

test("AdaptiveSlaThresholdView shows the status in capitals", () => {
  const item = newAdaptiveSlaThreshold("code-358", "name-94");
  const view = toAdaptiveSlaThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveSlaThresholdViews([item, item]).length, 2, "views");
});
