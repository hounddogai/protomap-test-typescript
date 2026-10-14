import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientLeaderboardWindow } from "./lenient-leaderboard-window.js";

test("LenientLeaderboardWindow starts in new", () => {
  const item = newLenientLeaderboardWindow("code-556", "label-587");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientLeaderboardWindow moves to done", () => {
  const item = newLenientLeaderboardWindow("code-556", "label-587");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("LenientLeaderboardWindow rejects moves from failed", () => {
  const item = newLenientLeaderboardWindow("code-556", "label-587");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
