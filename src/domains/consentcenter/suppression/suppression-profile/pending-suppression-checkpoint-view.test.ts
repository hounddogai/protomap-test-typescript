import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toPendingSuppressionCheckpointView,
  toPendingSuppressionCheckpointViews,
} from "./pending-suppression-checkpoint-view.js";
import { newPendingSuppressionCheckpoint } from "./pending-suppression-checkpoint.js";

test("PendingSuppressionCheckpointView shows the status in capitals", () => {
  const item = newPendingSuppressionCheckpoint("code-385", "label-487");
  const view = toPendingSuppressionCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingSuppressionCheckpointViews([item, item]).length, 2, "views");
});
