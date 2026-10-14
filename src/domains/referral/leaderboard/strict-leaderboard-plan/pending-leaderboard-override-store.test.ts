import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingLeaderboardOverrideStore } from "./pending-leaderboard-override-store.js";
import { newPendingLeaderboardOverride } from "./pending-leaderboard-override.js";

test("MemoryPendingLeaderboardOverrideStore finds what it saved", () => {
  const store = newMemoryPendingLeaderboardOverrideStore();
  const item = newPendingLeaderboardOverride("code-299", "label-918");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
