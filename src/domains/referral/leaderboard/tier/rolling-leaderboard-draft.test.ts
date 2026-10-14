import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingLeaderboardDraft } from "./rolling-leaderboard-draft.js";

test("RollingLeaderboardDraft starts in open", () => {
  const item = newRollingLeaderboardDraft("code-684", "title-348");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingLeaderboardDraft moves to resolved", () => {
  const item = newRollingLeaderboardDraft("code-684", "title-348");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("RollingLeaderboardDraft rejects moves from archived", () => {
  const item = newRollingLeaderboardDraft("code-684", "title-348");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
