import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toGlobalRetentionCheckpointView,
  toGlobalRetentionCheckpointViews,
} from "./global-retention-checkpoint-view.js";
import { newGlobalRetentionCheckpoint } from "./global-retention-checkpoint.js";

test("GlobalRetentionCheckpointView shows the status in capitals", () => {
  const item = newGlobalRetentionCheckpoint("code-597", "title-155");
  const view = toGlobalRetentionCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalRetentionCheckpointViews([item, item]).length, 2, "views");
});
