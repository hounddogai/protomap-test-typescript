import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualLeaderboardRollupStore } from "./manual-leaderboard-rollup-store.js";
import { newManualLeaderboardRollup } from "./manual-leaderboard-rollup.js";

test("MemoryManualLeaderboardRollupStore finds what it saved", () => {
  const store = newMemoryManualLeaderboardRollupStore();
  const item = newManualLeaderboardRollup("code-434", "name-180");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
