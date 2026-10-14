import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toTieredActivationCheckpointView,
  toTieredActivationCheckpointViews,
} from "./tiered-activation-checkpoint-view.js";
import { newTieredActivationCheckpoint } from "./tiered-activation-checkpoint.js";

test("TieredActivationCheckpointView shows the status in capitals", () => {
  const item = newTieredActivationCheckpoint("code-362", "name-513");
  const view = toTieredActivationCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredActivationCheckpointViews([item, item]).length, 2, "views");
});
