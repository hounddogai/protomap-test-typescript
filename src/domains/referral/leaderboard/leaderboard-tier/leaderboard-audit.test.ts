import assert from "node:assert/strict";
import { test } from "node:test";
import { newLeaderboardAudit } from "./leaderboard-audit.js";

test("LeaderboardAudit starts in planned", () => {
  const item = newLeaderboardAudit("code-470", "title-440");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LeaderboardAudit moves to completed", () => {
  const item = newLeaderboardAudit("code-470", "title-440");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("LeaderboardAudit rejects moves from cancelled", () => {
  const item = newLeaderboardAudit("code-470", "title-440");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
