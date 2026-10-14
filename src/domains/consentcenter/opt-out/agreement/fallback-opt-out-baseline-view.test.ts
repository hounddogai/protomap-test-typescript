import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackOptOutBaselineView, toFallbackOptOutBaselineViews } from "./fallback-opt-out-baseline-view.js";
import { newFallbackOptOutBaseline } from "./fallback-opt-out-baseline.js";

test("FallbackOptOutBaselineView shows the status in capitals", () => {
  const item = newFallbackOptOutBaseline("code-131", "label-63");
  const view = toFallbackOptOutBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackOptOutBaselineViews([item, item]).length, 2, "views");
});
