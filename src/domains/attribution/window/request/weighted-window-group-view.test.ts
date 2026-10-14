import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedWindowGroupView, toWeightedWindowGroupViews } from "./weighted-window-group-view.js";
import { newWeightedWindowGroup } from "./weighted-window-group.js";

test("WeightedWindowGroupView shows the status in capitals", () => {
  const item = newWeightedWindowGroup("code-746", "name-715");
  const view = toWeightedWindowGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedWindowGroupViews([item, item]).length, 2, "views");
});
