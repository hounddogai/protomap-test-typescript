import assert from "node:assert/strict";
import { test } from "node:test";
import { toActivationThresholdView, toActivationThresholdViews } from "./activation-threshold-view.js";
import { newActivationThreshold } from "./activation-threshold.js";

test("ActivationThresholdView shows the status in capitals", () => {
  const item = newActivationThreshold("code-709", "label-659");
  const view = toActivationThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toActivationThresholdViews([item, item]).length, 2, "views");
});
