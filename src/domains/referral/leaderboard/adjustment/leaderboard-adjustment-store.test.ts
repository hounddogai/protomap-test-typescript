import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLeaderboardAdjustmentStore } from "./leaderboard-adjustment-store.js";
import { newLeaderboardAdjustment } from "./leaderboard-adjustment.js";

test("MemoryLeaderboardAdjustmentStore finds what it saved", () => {
  const store = newMemoryLeaderboardAdjustmentStore();
  const item = newLeaderboardAdjustment("code-611", "label-255");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
