import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackLeaderboardBudgetStore } from "./fallback-leaderboard-budget-store.js";
import { newFallbackLeaderboardBudget } from "./fallback-leaderboard-budget.js";

test("MemoryFallbackLeaderboardBudgetStore finds what it saved", () => {
  const store = newMemoryFallbackLeaderboardBudgetStore();
  const item = newFallbackLeaderboardBudget("code-483", "name-773");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
