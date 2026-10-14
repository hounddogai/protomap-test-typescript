import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLeaderboardEstimateStore } from "./leaderboard-estimate-store.js";
import { newLeaderboardEstimate } from "./leaderboard-estimate.js";

test("MemoryLeaderboardEstimateStore finds what it saved", () => {
  const store = newMemoryLeaderboardEstimateStore();
  const item = newLeaderboardEstimate("code-985", "label-644");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
