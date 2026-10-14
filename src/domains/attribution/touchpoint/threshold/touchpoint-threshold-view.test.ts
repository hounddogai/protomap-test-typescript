import assert from "node:assert/strict";
import { test } from "node:test";
import { toTouchpointThresholdView, toTouchpointThresholdViews } from "./touchpoint-threshold-view.js";
import { newTouchpointThreshold } from "./touchpoint-threshold.js";

test("TouchpointThresholdView shows the status in capitals", () => {
  const item = newTouchpointThreshold("code-287", "label-439");
  const view = toTouchpointThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTouchpointThresholdViews([item, item]).length, 2, "views");
});
