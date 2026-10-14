import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryLeaderboardCheckpointStore } from "./primary-leaderboard-checkpoint-store.js";
import { newPrimaryLeaderboardCheckpoint } from "./primary-leaderboard-checkpoint.js";

test("MemoryPrimaryLeaderboardCheckpointStore finds what it saved", () => {
  const store = newMemoryPrimaryLeaderboardCheckpointStore();
  const item = newPrimaryLeaderboardCheckpoint("code-158", "label-709");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
