import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLeaderboardGroupStore } from "./leaderboard-group-store.js";
import { newLeaderboardGroup } from "./leaderboard-group.js";

test("MemoryLeaderboardGroupStore finds what it saved", () => {
  const store = newMemoryLeaderboardGroupStore();
  const item = newLeaderboardGroup("code-302", "label-380");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
