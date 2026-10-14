import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingLeaderboardTemplate } from "./rolling-leaderboard-template.js";

test("RollingLeaderboardTemplate starts in open", () => {
  const item = newRollingLeaderboardTemplate("code-447", "label-780");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingLeaderboardTemplate moves to in review", () => {
  const item = newRollingLeaderboardTemplate("code-447", "label-780");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("RollingLeaderboardTemplate rejects moves from archived", () => {
  const item = newRollingLeaderboardTemplate("code-447", "label-780");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
