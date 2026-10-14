import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toSeasonalLeaderboardSnapshotView,
  toSeasonalLeaderboardSnapshotViews,
} from "./seasonal-leaderboard-snapshot-view.js";
import { newSeasonalLeaderboardSnapshot } from "./seasonal-leaderboard-snapshot.js";

test("SeasonalLeaderboardSnapshotView shows the status in capitals", () => {
  const item = newSeasonalLeaderboardSnapshot("code-57", "title-745");
  const view = toSeasonalLeaderboardSnapshotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalLeaderboardSnapshotViews([item, item]).length, 2, "views");
});
