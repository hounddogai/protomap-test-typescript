import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalMacroThresholdView, toGlobalMacroThresholdViews } from "./global-macro-threshold-view.js";
import { newGlobalMacroThreshold } from "./global-macro-threshold.js";

test("GlobalMacroThresholdView shows the status in capitals", () => {
  const item = newGlobalMacroThreshold("code-938", "title-17");
  const view = toGlobalMacroThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalMacroThresholdViews([item, item]).length, 2, "views");
});
