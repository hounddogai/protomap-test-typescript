import assert from "node:assert/strict";
import { test } from "node:test";
import { toDoubleOptInThresholdView, toDoubleOptInThresholdViews } from "./double-opt-in-threshold-view.js";
import { newDoubleOptInThreshold } from "./double-opt-in-threshold.js";

test("DoubleOptInThresholdView shows the status in capitals", () => {
  const item = newDoubleOptInThreshold("code-833", "title-637");
  const view = toDoubleOptInThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDoubleOptInThresholdViews([item, item]).length, 2, "views");
});
