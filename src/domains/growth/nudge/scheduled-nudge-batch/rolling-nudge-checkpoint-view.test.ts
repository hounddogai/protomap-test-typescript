import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingNudgeCheckpointView, toRollingNudgeCheckpointViews } from "./rolling-nudge-checkpoint-view.js";
import { newRollingNudgeCheckpoint } from "./rolling-nudge-checkpoint.js";

test("RollingNudgeCheckpointView shows the status in capitals", () => {
  const item = newRollingNudgeCheckpoint("code-813", "name-830");
  const view = toRollingNudgeCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingNudgeCheckpointViews([item, item]).length, 2, "views");
});
