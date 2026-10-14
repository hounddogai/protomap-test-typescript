import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLeaderboardOverrideStore } from "./leaderboard-override-store.js";
import { newLeaderboardOverride } from "./leaderboard-override.js";

test("MemoryLeaderboardOverrideStore finds what it saved", () => {
  const store = newMemoryLeaderboardOverrideStore();
  const item = newLeaderboardOverride("code-397", "label-243");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
