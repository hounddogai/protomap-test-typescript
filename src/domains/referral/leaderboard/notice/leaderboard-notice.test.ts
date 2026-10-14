import assert from "node:assert/strict";
import { test } from "node:test";
import { newLeaderboardNotice } from "./leaderboard-notice.js";

test("LeaderboardNotice starts in draft", () => {
  const item = newLeaderboardNotice("code-975", "label-842");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LeaderboardNotice moves to pending", () => {
  const item = newLeaderboardNotice("code-975", "label-842");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("LeaderboardNotice rejects moves from closed", () => {
  const item = newLeaderboardNotice("code-975", "label-842");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
