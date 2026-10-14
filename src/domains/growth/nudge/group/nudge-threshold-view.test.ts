import assert from "node:assert/strict";
import { test } from "node:test";
import { toNudgeThresholdView, toNudgeThresholdViews } from "./nudge-threshold-view.js";
import { newNudgeThreshold } from "./nudge-threshold.js";

test("NudgeThresholdView shows the status in capitals", () => {
  const item = newNudgeThreshold("code-321", "label-601");
  const view = toNudgeThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toNudgeThresholdViews([item, item]).length, 2, "views");
});
