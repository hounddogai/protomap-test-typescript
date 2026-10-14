import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualLeaderboardMilestoneStore } from "./manual-leaderboard-milestone-store.js";
import { newManualLeaderboardMilestone } from "./manual-leaderboard-milestone.js";

test("MemoryManualLeaderboardMilestoneStore finds what it saved", () => {
  const store = newMemoryManualLeaderboardMilestoneStore();
  const item = newManualLeaderboardMilestone("code-371", "name-538");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
