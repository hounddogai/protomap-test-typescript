import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLeaderboardTierStore } from "./leaderboard-tier-store.js";
import { newLeaderboardTier } from "./leaderboard-tier.js";

test("MemoryLeaderboardTierStore finds what it saved", () => {
  const store = newMemoryLeaderboardTierStore();
  const item = newLeaderboardTier("code-917", "label-401");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
