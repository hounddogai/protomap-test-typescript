import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalLeaderboardRollupStore } from "./seasonal-leaderboard-rollup-store.js";
import { newSeasonalLeaderboardRollup } from "./seasonal-leaderboard-rollup.js";

test("MemorySeasonalLeaderboardRollupStore finds what it saved", () => {
  const store = newMemorySeasonalLeaderboardRollupStore();
  const item = newSeasonalLeaderboardRollup("code-212", "title-72");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
