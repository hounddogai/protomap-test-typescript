import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalPlacementGroupView, toGlobalPlacementGroupViews } from "./global-placement-group-view.js";
import { newGlobalPlacementGroup } from "./global-placement-group.js";

test("GlobalPlacementGroupView shows the status in capitals", () => {
  const item = newGlobalPlacementGroup("code-113", "title-388");
  const view = toGlobalPlacementGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalPlacementGroupViews([item, item]).length, 2, "views");
});
