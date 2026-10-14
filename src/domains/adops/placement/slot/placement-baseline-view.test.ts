import assert from "node:assert/strict";
import { test } from "node:test";
import { toPlacementBaselineView, toPlacementBaselineViews } from "./placement-baseline-view.js";
import { newPlacementBaseline } from "./placement-baseline.js";

test("PlacementBaselineView shows the status in capitals", () => {
  const item = newPlacementBaseline("code-828", "label-396");
  const view = toPlacementBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPlacementBaselineViews([item, item]).length, 2, "views");
});
