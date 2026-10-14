import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedPlacementGroupView, toBatchedPlacementGroupViews } from "./batched-placement-group-view.js";
import { newBatchedPlacementGroup } from "./batched-placement-group.js";

test("BatchedPlacementGroupView shows the status in capitals", () => {
  const item = newBatchedPlacementGroup("code-305", "title-768");
  const view = toBatchedPlacementGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedPlacementGroupViews([item, item]).length, 2, "views");
});
