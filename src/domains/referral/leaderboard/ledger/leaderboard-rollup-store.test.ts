import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLeaderboardRollupStore } from "./leaderboard-rollup-store.js";
import { newLeaderboardRollup } from "./leaderboard-rollup.js";

test("MemoryLeaderboardRollupStore finds what it saved", () => {
  const store = newMemoryLeaderboardRollupStore();
  const item = newLeaderboardRollup("code-103", "title-983");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
