import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toLenientFrequencyBaselineView,
  toLenientFrequencyBaselineViews,
} from "./lenient-frequency-baseline-view.js";
import { newLenientFrequencyBaseline } from "./lenient-frequency-baseline.js";

test("LenientFrequencyBaselineView shows the status in capitals", () => {
  const item = newLenientFrequencyBaseline("code-725", "title-751");
  const view = toLenientFrequencyBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientFrequencyBaselineViews([item, item]).length, 2, "views");
});
