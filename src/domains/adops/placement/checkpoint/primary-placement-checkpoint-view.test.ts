import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toPrimaryPlacementCheckpointView,
  toPrimaryPlacementCheckpointViews,
} from "./primary-placement-checkpoint-view.js";
import { newPrimaryPlacementCheckpoint } from "./primary-placement-checkpoint.js";

test("PrimaryPlacementCheckpointView shows the status in capitals", () => {
  const item = newPrimaryPlacementCheckpoint("code-443", "title-96");
  const view = toPrimaryPlacementCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryPlacementCheckpointViews([item, item]).length, 2, "views");
});
