import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryLeaderboardAdjustmentStore } from "./primary-leaderboard-adjustment-store.js";
import { newPrimaryLeaderboardAdjustment } from "./primary-leaderboard-adjustment.js";

test("MemoryPrimaryLeaderboardAdjustmentStore finds what it saved", () => {
  const store = newMemoryPrimaryLeaderboardAdjustmentStore();
  const item = newPrimaryLeaderboardAdjustment("code-129", "name-693");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
