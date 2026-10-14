import assert from "node:assert/strict";
import { test } from "node:test";
import { toPlacementCheckpointView, toPlacementCheckpointViews } from "./placement-checkpoint-view.js";
import { newPlacementCheckpoint } from "./placement-checkpoint.js";

test("PlacementCheckpointView shows the status in capitals", () => {
  const item = newPlacementCheckpoint("code-257", "label-422");
  const view = toPlacementCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPlacementCheckpointViews([item, item]).length, 2, "views");
});
