import assert from "node:assert/strict";
import { test } from "node:test";
import { toLeaderboardDigestView, toLeaderboardDigestViews } from "./leaderboard-digest-view.js";
import { newLeaderboardDigest } from "./leaderboard-digest.js";

test("LeaderboardDigestView shows the status in capitals", () => {
  const item = newLeaderboardDigest("code-386", "name-543");
  const view = toLeaderboardDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLeaderboardDigestViews([item, item]).length, 2, "views");
});
