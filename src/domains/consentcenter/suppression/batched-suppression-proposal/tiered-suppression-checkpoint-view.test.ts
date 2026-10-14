import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toTieredSuppressionCheckpointView,
  toTieredSuppressionCheckpointViews,
} from "./tiered-suppression-checkpoint-view.js";
import { newTieredSuppressionCheckpoint } from "./tiered-suppression-checkpoint.js";

test("TieredSuppressionCheckpointView shows the status in capitals", () => {
  const item = newTieredSuppressionCheckpoint("code-546", "name-204");
  const view = toTieredSuppressionCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredSuppressionCheckpointViews([item, item]).length, 2, "views");
});
