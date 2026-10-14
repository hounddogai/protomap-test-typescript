import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLeaderboardPolicyStore } from "./leaderboard-policy-store.js";
import { newLeaderboardPolicy } from "./leaderboard-policy.js";

test("MemoryLeaderboardPolicyStore finds what it saved", () => {
  const store = newMemoryLeaderboardPolicyStore();
  const item = newLeaderboardPolicy("code-665", "label-575");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
