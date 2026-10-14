import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictLeaderboardAllocationStore } from "./strict-leaderboard-allocation-store.js";
import { newStrictLeaderboardAllocation } from "./strict-leaderboard-allocation.js";

test("MemoryStrictLeaderboardAllocationStore finds what it saved", () => {
  const store = newMemoryStrictLeaderboardAllocationStore();
  const item = newStrictLeaderboardAllocation("code-984", "title-303");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
