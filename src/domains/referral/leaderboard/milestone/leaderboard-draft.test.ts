import assert from "node:assert/strict";
import { test } from "node:test";
import { newLeaderboardDraft } from "./leaderboard-draft.js";

test("LeaderboardDraft starts in new", () => {
  const item = newLeaderboardDraft("code-924", "label-693");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LeaderboardDraft moves to done", () => {
  const item = newLeaderboardDraft("code-924", "label-693");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("LeaderboardDraft rejects moves from failed", () => {
  const item = newLeaderboardDraft("code-924", "label-693");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
