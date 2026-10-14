import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedTierGroupView, toBatchedTierGroupViews } from "./batched-tier-group-view.js";
import { newBatchedTierGroup } from "./batched-tier-group.js";

test("BatchedTierGroupView shows the status in capitals", () => {
  const item = newBatchedTierGroup("code-560", "title-679");
  const view = toBatchedTierGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedTierGroupViews([item, item]).length, 2, "views");
});
