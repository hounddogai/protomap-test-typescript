import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackFrequencyCycleView, toFallbackFrequencyCycleViews } from "./fallback-frequency-cycle-view.js";
import { newFallbackFrequencyCycle } from "./fallback-frequency-cycle.js";

test("FallbackFrequencyCycleView shows the status in capitals", () => {
  const item = newFallbackFrequencyCycle("code-479", "label-585");
  const view = toFallbackFrequencyCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackFrequencyCycleViews([item, item]).length, 2, "views");
});
