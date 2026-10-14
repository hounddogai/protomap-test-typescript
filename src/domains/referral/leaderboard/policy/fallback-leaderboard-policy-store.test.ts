import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackLeaderboardPolicyStore } from "./fallback-leaderboard-policy-store.js";
import { newFallbackLeaderboardPolicy } from "./fallback-leaderboard-policy.js";

test("MemoryFallbackLeaderboardPolicyStore finds what it saved", () => {
  const store = newMemoryFallbackLeaderboardPolicyStore();
  const item = newFallbackLeaderboardPolicy("code-33", "name-506");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
