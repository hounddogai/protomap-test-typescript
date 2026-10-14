import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLeaderboardSnapshotStore } from "./leaderboard-snapshot-store.js";
import { newLeaderboardSnapshot } from "./leaderboard-snapshot.js";

test("MemoryLeaderboardSnapshotStore finds what it saved", () => {
  const store = newMemoryLeaderboardSnapshotStore();
  const item = newLeaderboardSnapshot("code-81", "name-660");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
