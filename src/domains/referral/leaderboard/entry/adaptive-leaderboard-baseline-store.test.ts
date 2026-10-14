import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveLeaderboardBaselineStore } from "./adaptive-leaderboard-baseline-store.js";
import { newAdaptiveLeaderboardBaseline } from "./adaptive-leaderboard-baseline.js";

test("MemoryAdaptiveLeaderboardBaselineStore finds what it saved", () => {
  const store = newMemoryAdaptiveLeaderboardBaselineStore();
  const item = newAdaptiveLeaderboardBaseline("code-913", "name-397");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
