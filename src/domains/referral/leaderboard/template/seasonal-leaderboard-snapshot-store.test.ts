import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalLeaderboardSnapshotStore } from "./seasonal-leaderboard-snapshot-store.js";
import { newSeasonalLeaderboardSnapshot } from "./seasonal-leaderboard-snapshot.js";

test("MemorySeasonalLeaderboardSnapshotStore finds what it saved", () => {
  const store = newMemorySeasonalLeaderboardSnapshotStore();
  const item = newSeasonalLeaderboardSnapshot("code-57", "title-745");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
