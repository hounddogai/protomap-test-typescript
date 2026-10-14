import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLeaderboardAllocationStore } from "./leaderboard-allocation-store.js";
import { newLeaderboardAllocation } from "./leaderboard-allocation.js";

test("MemoryLeaderboardAllocationStore finds what it saved", () => {
  const store = newMemoryLeaderboardAllocationStore();
  const item = newLeaderboardAllocation("code-371", "name-363");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
