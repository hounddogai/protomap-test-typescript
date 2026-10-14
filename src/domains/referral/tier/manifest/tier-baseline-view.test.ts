import assert from "node:assert/strict";
import { test } from "node:test";
import { toTierBaselineView, toTierBaselineViews } from "./tier-baseline-view.js";
import { newTierBaseline } from "./tier-baseline.js";

test("TierBaselineView shows the status in capitals", () => {
  const item = newTierBaseline("code-578", "label-341");
  const view = toTierBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTierBaselineViews([item, item]).length, 2, "views");
});
