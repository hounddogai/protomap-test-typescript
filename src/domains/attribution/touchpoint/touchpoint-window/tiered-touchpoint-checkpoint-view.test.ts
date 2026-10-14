import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toTieredTouchpointCheckpointView,
  toTieredTouchpointCheckpointViews,
} from "./tiered-touchpoint-checkpoint-view.js";
import { newTieredTouchpointCheckpoint } from "./tiered-touchpoint-checkpoint.js";

test("TieredTouchpointCheckpointView shows the status in capitals", () => {
  const item = newTieredTouchpointCheckpoint("code-796", "name-507");
  const view = toTieredTouchpointCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredTouchpointCheckpointViews([item, item]).length, 2, "views");
});
