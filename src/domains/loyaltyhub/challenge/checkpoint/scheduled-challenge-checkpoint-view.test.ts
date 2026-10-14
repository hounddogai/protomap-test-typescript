import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toScheduledChallengeCheckpointView,
  toScheduledChallengeCheckpointViews,
} from "./scheduled-challenge-checkpoint-view.js";
import { newScheduledChallengeCheckpoint } from "./scheduled-challenge-checkpoint.js";

test("ScheduledChallengeCheckpointView shows the status in capitals", () => {
  const item = newScheduledChallengeCheckpoint("code-8", "name-543");
  const view = toScheduledChallengeCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledChallengeCheckpointViews([item, item]).length, 2, "views");
});
