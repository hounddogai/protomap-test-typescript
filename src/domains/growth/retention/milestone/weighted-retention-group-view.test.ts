import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedRetentionGroupView, toWeightedRetentionGroupViews } from "./weighted-retention-group-view.js";
import { newWeightedRetentionGroup } from "./weighted-retention-group.js";

test("WeightedRetentionGroupView shows the status in capitals", () => {
  const item = newWeightedRetentionGroup("code-698", "name-613");
  const view = toWeightedRetentionGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedRetentionGroupViews([item, item]).length, 2, "views");
});
