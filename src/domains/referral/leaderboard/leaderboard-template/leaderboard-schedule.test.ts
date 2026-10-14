import assert from "node:assert/strict";
import { test } from "node:test";
import { newLeaderboardSchedule } from "./leaderboard-schedule.js";

test("LeaderboardSchedule starts in proposed", () => {
  const item = newLeaderboardSchedule("code-159", "label-457");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LeaderboardSchedule moves to approved", () => {
  const item = newLeaderboardSchedule("code-159", "label-457");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("LeaderboardSchedule rejects moves from withdrawn", () => {
  const item = newLeaderboardSchedule("code-159", "label-457");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
