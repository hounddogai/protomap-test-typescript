import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLeaderboardMappingStore } from "./leaderboard-mapping-store.js";
import { newLeaderboardMapping } from "./leaderboard-mapping.js";

test("MemoryLeaderboardMappingStore finds what it saved", () => {
  const store = newMemoryLeaderboardMappingStore();
  const item = newLeaderboardMapping("code-192", "name-295");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
