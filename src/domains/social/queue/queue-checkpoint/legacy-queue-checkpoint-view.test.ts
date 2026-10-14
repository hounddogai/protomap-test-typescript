import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyQueueCheckpointView, toLegacyQueueCheckpointViews } from "./legacy-queue-checkpoint-view.js";
import { newLegacyQueueCheckpoint } from "./legacy-queue-checkpoint.js";

test("LegacyQueueCheckpointView shows the status in capitals", () => {
  const item = newLegacyQueueCheckpoint("code-659", "label-142");
  const view = toLegacyQueueCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyQueueCheckpointViews([item, item]).length, 2, "views");
});
