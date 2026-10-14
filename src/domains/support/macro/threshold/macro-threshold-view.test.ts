import assert from "node:assert/strict";
import { test } from "node:test";
import { toMacroThresholdView, toMacroThresholdViews } from "./macro-threshold-view.js";
import { newMacroThreshold } from "./macro-threshold.js";

test("MacroThresholdView shows the status in capitals", () => {
  const item = newMacroThreshold("code-38", "title-445");
  const view = toMacroThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toMacroThresholdViews([item, item]).length, 2, "views");
});
