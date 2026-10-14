import assert from "node:assert/strict";
import { test } from "node:test";
import { toLeaderboardSnapshotView, toLeaderboardSnapshotViews } from "./leaderboard-snapshot-view.js";
import { newLeaderboardSnapshot } from "./leaderboard-snapshot.js";

test("LeaderboardSnapshotView shows the status in capitals", () => {
  const item = newLeaderboardSnapshot("code-81", "name-660");
  const view = toLeaderboardSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLeaderboardSnapshotViews([item, item]).length, 2, "views");
});
