import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictLeaderboardWindow } from "./strict-leaderboard-window.js";

test("StrictLeaderboardWindow starts in planned", () => {
  const item = newStrictLeaderboardWindow("code-668", "label-531");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictLeaderboardWindow moves to in progress", () => {
  const item = newStrictLeaderboardWindow("code-668", "label-531");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("StrictLeaderboardWindow rejects moves from cancelled", () => {
  const item = newStrictLeaderboardWindow("code-668", "label-531");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
