import assert from "node:assert/strict";
import { test } from "node:test";
import { newLeaderboardSummary } from "./leaderboard-summary.js";

test("LeaderboardSummary starts in created", () => {
  const item = newLeaderboardSummary("code-354", "label-172");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LeaderboardSummary moves to published", () => {
  const item = newLeaderboardSummary("code-354", "label-172");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("LeaderboardSummary rejects moves from retired", () => {
  const item = newLeaderboardSummary("code-354", "label-172");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
