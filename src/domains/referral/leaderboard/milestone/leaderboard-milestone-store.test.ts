import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLeaderboardMilestoneStore } from "./leaderboard-milestone-store.js";
import { newLeaderboardMilestone } from "./leaderboard-milestone.js";

test("MemoryLeaderboardMilestoneStore finds what it saved", () => {
  const store = newMemoryLeaderboardMilestoneStore();
  const item = newLeaderboardMilestone("code-841", "label-99");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
