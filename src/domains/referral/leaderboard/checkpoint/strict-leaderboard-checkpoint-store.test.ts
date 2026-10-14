import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictLeaderboardCheckpointStore } from "./strict-leaderboard-checkpoint-store.js";
import { newStrictLeaderboardCheckpoint } from "./strict-leaderboard-checkpoint.js";

test("MemoryStrictLeaderboardCheckpointStore finds what it saved", () => {
  const store = newMemoryStrictLeaderboardCheckpointStore();
  const item = newStrictLeaderboardCheckpoint("code-360", "label-616");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
