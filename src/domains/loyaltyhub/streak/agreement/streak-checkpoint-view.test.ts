import assert from "node:assert/strict";
import { test } from "node:test";
import { toStreakCheckpointView, toStreakCheckpointViews } from "./streak-checkpoint-view.js";
import { newStreakCheckpoint } from "./streak-checkpoint.js";

test("StreakCheckpointView shows the status in capitals", () => {
  const item = newStreakCheckpoint("code-282", "title-733");
  const view = toStreakCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStreakCheckpointViews([item, item]).length, 2, "views");
});
