import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackLeaderboardAllocationStore } from "./fallback-leaderboard-allocation-store.js";
import { newFallbackLeaderboardAllocation } from "./fallback-leaderboard-allocation.js";

test("MemoryFallbackLeaderboardAllocationStore finds what it saved", () => {
  const store = newMemoryFallbackLeaderboardAllocationStore();
  const item = newFallbackLeaderboardAllocation("code-64", "title-7");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
