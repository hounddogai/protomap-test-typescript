import assert from "node:assert/strict";
import { test } from "node:test";
import { toFrequencyBaselineView, toFrequencyBaselineViews } from "./frequency-baseline-view.js";
import { newFrequencyBaseline } from "./frequency-baseline.js";

test("FrequencyBaselineView shows the status in capitals", () => {
  const item = newFrequencyBaseline("code-372", "name-648");
  const view = toFrequencyBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFrequencyBaselineViews([item, item]).length, 2, "views");
});
