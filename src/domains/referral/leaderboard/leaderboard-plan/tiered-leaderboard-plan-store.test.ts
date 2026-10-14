import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredLeaderboardPlanStore } from "./tiered-leaderboard-plan-store.js";
import { newTieredLeaderboardPlan } from "./tiered-leaderboard-plan.js";

test("MemoryTieredLeaderboardPlanStore finds what it saved", () => {
  const store = newMemoryTieredLeaderboardPlanStore();
  const item = newTieredLeaderboardPlan("code-940", "name-516");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
