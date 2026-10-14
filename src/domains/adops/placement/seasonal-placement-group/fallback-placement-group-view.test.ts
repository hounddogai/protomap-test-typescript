import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackPlacementGroupView, toFallbackPlacementGroupViews } from "./fallback-placement-group-view.js";
import { newFallbackPlacementGroup } from "./fallback-placement-group.js";

test("FallbackPlacementGroupView shows the status in capitals", () => {
  const item = newFallbackPlacementGroup("code-927", "title-26");
  const view = toFallbackPlacementGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackPlacementGroupViews([item, item]).length, 2, "views");
});
