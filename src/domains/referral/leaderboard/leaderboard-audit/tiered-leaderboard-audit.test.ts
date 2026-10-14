import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredLeaderboardAudit } from "./tiered-leaderboard-audit.js";

test("TieredLeaderboardAudit starts in draft", () => {
  const item = newTieredLeaderboardAudit("code-938", "name-220");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredLeaderboardAudit moves to pending", () => {
  const item = newTieredLeaderboardAudit("code-938", "name-220");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("TieredLeaderboardAudit rejects moves from closed", () => {
  const item = newTieredLeaderboardAudit("code-938", "name-220");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
