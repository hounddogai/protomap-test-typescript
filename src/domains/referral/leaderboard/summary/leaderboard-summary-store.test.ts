import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLeaderboardSummaryStore } from "./leaderboard-summary-store.js";
import { newLeaderboardSummary } from "./leaderboard-summary.js";

test("MemoryLeaderboardSummaryStore finds what it saved", () => {
  const store = newMemoryLeaderboardSummaryStore();
  const item = newLeaderboardSummary("code-354", "label-172");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
