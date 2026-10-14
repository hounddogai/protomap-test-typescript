import assert from "node:assert/strict";
import { test } from "node:test";
import { toNudgeCheckpointView, toNudgeCheckpointViews } from "./nudge-checkpoint-view.js";
import { newNudgeCheckpoint } from "./nudge-checkpoint.js";

test("NudgeCheckpointView shows the status in capitals", () => {
  const item = newNudgeCheckpoint("code-734", "name-714");
  const view = toNudgeCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toNudgeCheckpointViews([item, item]).length, 2, "views");
});
