import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toGlobalSuppressionCheckpointView,
  toGlobalSuppressionCheckpointViews,
} from "./global-suppression-checkpoint-view.js";
import { newGlobalSuppressionCheckpoint } from "./global-suppression-checkpoint.js";

test("GlobalSuppressionCheckpointView shows the status in capitals", () => {
  const item = newGlobalSuppressionCheckpoint("code-673", "title-277");
  const view = toGlobalSuppressionCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalSuppressionCheckpointViews([item, item]).length, 2, "views");
});
