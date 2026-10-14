import assert from "node:assert/strict";
import { test } from "node:test";
import { newLeaderboardMilestone } from "./leaderboard-milestone.js";

test("LeaderboardMilestone starts in draft", () => {
  const item = newLeaderboardMilestone("code-841", "label-99");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LeaderboardMilestone moves to suspended", () => {
  const item = newLeaderboardMilestone("code-841", "label-99");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("LeaderboardMilestone rejects moves from closed", () => {
  const item = newLeaderboardMilestone("code-841", "label-99");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
