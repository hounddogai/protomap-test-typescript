import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedFrequencyBaselineView, toCappedFrequencyBaselineViews } from "./capped-frequency-baseline-view.js";
import { newCappedFrequencyBaseline } from "./capped-frequency-baseline.js";

test("CappedFrequencyBaselineView shows the status in capitals", () => {
  const item = newCappedFrequencyBaseline("code-364", "name-523");
  const view = toCappedFrequencyBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedFrequencyBaselineViews([item, item]).length, 2, "views");
});
