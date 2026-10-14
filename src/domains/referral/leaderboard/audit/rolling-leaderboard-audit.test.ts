import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingLeaderboardAudit } from "./rolling-leaderboard-audit.js";

test("RollingLeaderboardAudit starts in draft", () => {
  const item = newRollingLeaderboardAudit("code-153", "label-127");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingLeaderboardAudit moves to suspended", () => {
  const item = newRollingLeaderboardAudit("code-153", "label-127");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("RollingLeaderboardAudit rejects moves from closed", () => {
  const item = newRollingLeaderboardAudit("code-153", "label-127");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
