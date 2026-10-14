import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedWindowOverrideView, toWeightedWindowOverrideViews } from "./weighted-window-override-view.js";
import { newWeightedWindowOverride } from "./weighted-window-override.js";

test("WeightedWindowOverrideView shows the status in capitals", () => {
  const item = newWeightedWindowOverride("code-709", "label-449");
  const view = toWeightedWindowOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedWindowOverrideViews([item, item]).length, 2, "views");
});
