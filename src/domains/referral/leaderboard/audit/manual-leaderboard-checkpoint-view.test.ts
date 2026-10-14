import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toManualLeaderboardCheckpointView,
  toManualLeaderboardCheckpointViews,
} from "./manual-leaderboard-checkpoint-view.js";
import { newManualLeaderboardCheckpoint } from "./manual-leaderboard-checkpoint.js";

test("ManualLeaderboardCheckpointView shows the status in capitals", () => {
  const item = newManualLeaderboardCheckpoint("code-152", "title-763");
  const view = toManualLeaderboardCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualLeaderboardCheckpointViews([item, item]).length, 2, "views");
});
