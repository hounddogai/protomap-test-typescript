import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingPacingThresholdView, toRollingPacingThresholdViews } from "./rolling-pacing-threshold-view.js";
import { newRollingPacingThreshold } from "./rolling-pacing-threshold.js";

test("RollingPacingThresholdView shows the status in capitals", () => {
  const item = newRollingPacingThreshold("code-106", "name-369");
  const view = toRollingPacingThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingPacingThresholdViews([item, item]).length, 2, "views");
});
