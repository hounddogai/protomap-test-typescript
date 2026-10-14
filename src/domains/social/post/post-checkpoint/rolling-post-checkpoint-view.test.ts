import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingPostCheckpointView, toRollingPostCheckpointViews } from "./rolling-post-checkpoint-view.js";
import { newRollingPostCheckpoint } from "./rolling-post-checkpoint.js";

test("RollingPostCheckpointView shows the status in capitals", () => {
  const item = newRollingPostCheckpoint("code-992", "name-203");
  const view = toRollingPostCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingPostCheckpointViews([item, item]).length, 2, "views");
});
