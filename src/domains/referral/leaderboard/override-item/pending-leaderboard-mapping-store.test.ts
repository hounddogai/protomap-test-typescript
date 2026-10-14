import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingLeaderboardMappingStore } from "./pending-leaderboard-mapping-store.js";
import { newPendingLeaderboardMapping } from "./pending-leaderboard-mapping.js";

test("MemoryPendingLeaderboardMappingStore finds what it saved", () => {
  const store = newMemoryPendingLeaderboardMappingStore();
  const item = newPendingLeaderboardMapping("code-689", "name-900");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
