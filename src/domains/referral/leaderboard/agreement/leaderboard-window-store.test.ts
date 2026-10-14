import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLeaderboardWindowStore } from "./leaderboard-window-store.js";
import { newLeaderboardWindow } from "./leaderboard-window.js";

test("MemoryLeaderboardWindowStore finds what it saved", () => {
  const store = newMemoryLeaderboardWindowStore();
  const item = newLeaderboardWindow("code-21", "name-608");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
